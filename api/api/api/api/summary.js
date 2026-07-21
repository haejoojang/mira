// api/summary.js
// Returns period history as JSON, in the same start/end/duration/cycle shape as
// the original screenshot that kicked this whole project off. Requires the user's
// own Supabase session token (passed as a bearer token from the browser) so it can
// only ever return that person's own data — RLS enforces this at the database level
// even though this function uses the anon key, not the service role key.

const { createClient } = require('@supabase/supabase-js');
const { toDate } = require('./_lib/cycle');

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.replace('Bearer ', '');
  if (!accessToken) return res.status(401).json({ error: 'missing session' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });

  const { data: entries, error } = await supabase
    .from('cycle_entries')
    .select('entry_date, category')
    .in('category', ['period_start', 'period_end'])
    .order('entry_date', { ascending: false });

  if (error) return res.status(401).json({ error: 'invalid session' });

  const starts = entries.filter(e => e.category === 'period_start');
  const rows = starts.map((s, i) => {
    const end = entries.find(e => e.category === 'period_end' && e.entry_date >= s.entry_date);
    const nextStart = starts[i + 1];
    const duration = end ? Math.round((toDate(end.entry_date) - toDate(s.entry_date)) / 86400000) + 1 : null;
    const cycle = nextStart ? Math.round((toDate(s.entry_date) - toDate(nextStart.entry_date)) / 86400000) : null;
    return { start: s.entry_date, end: end ? end.entry_date : null, duration, cycle };
  });

  return res.status(200).json({ rows });
};
