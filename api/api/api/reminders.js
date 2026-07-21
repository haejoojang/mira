// api/reminders.js
// Triggered once daily by Vercel Cron (see vercel.json). For each user, checks
// whether TODAY happens to be exactly their configured lead-time before a predicted
// period or ovulation date. If not, does nothing for that user — this is the
// mechanism that keeps Mira from emailing daily, per the deliberate design decision
// that frequent emails could itself be a safety risk in unsafe households.

const { createClient } = require('@supabase/supabase-js');
const { computeCycleStats, toDate } = require('./_lib/cycle');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function daysUntil(todayISO, targetISO) {
  return Math.round((toDate(targetISO) - toDate(todayISO)) / 86400000);
}

async function sendReminder(email, kind, dateISO) {
  const label = kind === 'period' ? 'period' : 'fertile window / ovulation';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'mira <hello@mira.diary>',
      to: email,
      subject: kind === 'period' ? 'Period expected soon' : 'Fertile window expected soon',
      html: `<p>Based on your own history, your ${label} is expected around <b>${dateISO}</b>.</p>
             <p style="font-size:12px;color:#8a8175">This is an estimate from your own past dates, not medical advice.</p>`
    })
  });
}

module.exports = async (req, res) => {
  // Protect the cron endpoint from being called by anyone but Vercel itself.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const { data: profiles } = await supabase.from('profiles').select('id, email, reminder_lead_days');
  let sent = 0;

  for (const profile of profiles || []) {
    const { data: periodEntries } = await supabase
      .from('cycle_entries')
      .select('entry_date, category')
      .eq('user_id', profile.id)
      .in('category', ['period_start', 'period_end'])
      .order('entry_date', { ascending: false });

    const starts = (periodEntries || []).filter(e => e.category === 'period_start');
    const periods = starts.map(s => {
      const end = (periodEntries || []).find(e => e.category === 'period_end' && e.entry_date >= s.entry_date);
      return { start_date: s.entry_date, end_date: end ? end.entry_date : null };
    });

    const stats = computeCycleStats(periods);
    if (!stats) continue;

    if (daysUntil(todayISO, stats.nextPeriodStart) === profile.reminder_lead_days) {
      await sendReminder(profile.email, 'period', stats.nextPeriodStart);
      sent++;
    }
    if (daysUntil(todayISO, stats.fertileStart) === profile.reminder_lead_days) {
      await sendReminder(profile.email, 'fertile', stats.fertileStart);
      sent++;
    }
  }

  return res.status(200).json({ ok: true, remindersSent: sent });
};
