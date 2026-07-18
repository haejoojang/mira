// Shared cycle math. Pure functions, no I/O — used by reminders, calendar export, and the summary page.

function toDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function toISO(date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

// periods: array of {start_date, end_date} ISO strings, most recent first
function computeCycleStats(periods) {
  if (!periods || periods.length === 0) return null;

  const sorted = [...periods].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  const cycles = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = (toDate(sorted[i].start_date) - toDate(sorted[i + 1].start_date)) / 86400000;
    if (gap > 0 && gap < 90) cycles.push(gap); // exclude obvious outliers/gaps in data
  }
  const durations = sorted.map(p => {
    if (!p.end_date) return null;
    return (toDate(p.end_date) - toDate(p.start_date)) / 86400000 + 1;
  }).filter(d => d !== null && d > 0 && d < 15);

  const avgCycle = cycles.length ? cycles.reduce((a, b) => a + b, 0) / cycles.length : 28;
  const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 5;

  const last = sorted[0];
  const lastStart = toDate(last.start_date);
  const nextStart = addDays(lastStart, Math.round(avgCycle));
  const nextEnd = addDays(nextStart, Math.round(avgDuration) - 1);
  const ovulation = addDays(nextStart, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  return {
    avgCycle, avgDuration,
    lastPeriodStart: last.start_date,
    lastPeriodEnd: last.end_date || null,
    nextPeriodStart: toISO(nextStart),
    nextPeriodEnd: toISO(nextEnd),
    ovulation: toISO(ovulation),
    fertileStart: toISO(fertileStart),
    fertileEnd: toISO(fertileEnd),
    cyclesUsed: cycles.length
  };
}

module.exports = { computeCycleStats, toDate, toISO, addDays };
