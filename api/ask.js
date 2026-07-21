// api/ask.js
// Powers the search bar in the web diary view. Takes the typed text + the user's
// own precomputed stats (sent from the browser, already scoped to that user),
// classifies it, and returns structured JSON. It does NOT write to the database —
// the browser does that afterward using the user's own Supabase session, so this
// function never needs a service-role key or database access at all.

const SYSTEM_PROMPT = `You are the assistant inside "mira", a private diary app for tracking menstrual cycles. Classify the input into exactly one of four types:

NAVIGATE — wants to see the full calendar/history (e.g. "show my calendar").
QUESTION — asking about cycle/fertility/predictions, answerable ONLY from the provided computed data.
LOG — an ordinary record (period, symptom, mood, spotting, medication, sex) with no urgency. Extract every distinct date mentioned as a separate entry.
CONCERN — anything suggesting medical urgency (heavy/prolonged bleeding, severe pain, months without a period) or personal safety risk (self-harm, abuse). Use this even if it also contains loggable content.

Respond with ONLY raw JSON, no markdown fences, exactly one shape:
{"type":"navigate","answer":"<short ack>"}
{"type":"question","answer":"<warm, direct, 1-3 sentences, using ONLY the given computed numbers>"}
{"type":"log","entries":[{"date":"YYYY-MM-DD","category":"period_start|period_end|symptom|mood|spotting|medication|sex|other"}]}
{"type":"concern","answer":"<calm, 1-4 sentence response — never diagnose, recommend a doctor or appropriate support without alarmism>","entries":[<optional, same shape as log>]}

Resolve bare day numbers against the month named in the text; use the year implied by today's date if unstated. If no date is mentioned, use today. Never give medical advice or diagnoses. Never moralize about what's logged.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { text, context } = req.body;
    if (!text || !context) return res.status(400).json({ error: 'missing text/context' });

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `User input: "${text}"\n\nContext:\n${JSON.stringify(context)}` }]
      })
    });
    const data = await apiRes.json();
    const block = (data.content || []).find(b => b.type === 'text');
    const raw = (block ? block.text : '{}').replace(/```json|```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { type: 'question', answer: "Couldn't quite parse that — try rephrasing." }; }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('ask error:', err.message);
    return res.status(500).json({ error: 'internal error' });
  }
};
