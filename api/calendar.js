// api/calendar.js
// Serves an .ics feed that iPhone, Android, and Google Calendar can all subscribe to
// (webcal:// or a plain https link added as a subscribed calendar). Authenticated by
// a private, unguessable per-user token — not a login session, since calendar apps
// can't complete a magic-link flow. Events are deliberately vague: "Mira reminder",
// never a description mentioning sex, symptoms, or anything specific, since calendar
// entries often sync to a cloud service outside Mira's control.

const { createClient } = require('@supabase/supabase-js');
const { computeCycleStats } = require('./_lib/cycle');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function icsDate(iso) {
  return iso.replace(/-/g, '');
}

function buildICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mira//diary//EN',
    'CALSCALE:GREGORIAN',
    ...events.flatMap(e => [
      'BEGIN:VEVENT',
      `UID:${e.uid}@mira.diary`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `SUMMARY:${e.title}`,
      'END:VEVENT'
    ]),
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

module.exports = async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('missing token');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('calendar_token', token)
    .single();
  if (!profile) return res.status(404).send('not found');

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
  const events = [];
  if (stats) {
    events.push({ uid: 'next-period', date: stats.nextPeriodStart, title: 'Mira reminder — period expected' });
    events.push({ uid: 'fertile-window', date: stats.fertileStart, title: 'Mira reminder — fertile window' });
  }
  periods.forEach((p, i) => {
    events.push({ uid: `period-${p.start_date}`, date: p.start_date, title: 'Mira — logged period' });
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="mira.ics"');
  return res.status(200).send(buildICS(events));
};
