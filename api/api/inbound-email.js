// api/inbound-email.js
// Resend forwards inbound emails to this webhook. This is the function that makes
// Mira's "zero retention" claim literally true: the raw text is read once, in memory,
// used to call Claude for extraction, and then never written to disk or database.
// Only the extracted {date, category} pairs are persisted.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-only key, bypasses RLS deliberately for this trusted path
);

const SYSTEM_PROMPT = `You are the parser inside "mira", a private diary app. You receive a raw email reply and today's date. Extract every distinct dated event mentioned. Respond with ONLY raw JSON, no markdown, no preamble:

{"entries":[{"date":"YYYY-MM-DD","category":"period_start|period_end|symptom|mood|spotting|medication|sex|other"}, ...], "concern": true|false, "concernNote": "<one short phrase if concern is true, else omit>"}

Rules:
- One entry per distinct date mentioned, even if there are many (e.g. "sex on the 3rd, 7th, 10th, 13th and 21st of june" is five entries).
- Resolve bare day numbers against the month named in the text; if no year is stated, use the year implied by today's date.
- If no date is mentioned at all, use today's date for a single entry.
- Set "concern": true if the text suggests something needing medical or safety attention (heavy/prolonged bleeding, severe pain, months without a period, self-harm, abuse) — this does not block logging, it just flags the reply Mira sends back.
- Never include any of the original wording in your response — only structured dates and categories.`;

async function extractWithClaude(emailText, todayISO) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
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
      messages: [{ role: 'user', content: `Today: ${todayISO}\n\nEmail text:\n"""${emailText}"""` }]
    })
  });
  const data = await res.json();
  const block = (data.content || []).find(b => b.type === 'text');
  const raw = (block ? block.text : '{}').replace(/```json|```/g, '').trim();
  try { return JSON.parse(raw); } catch { return { entries: [], concern: false }; }
}

async function sendConfirmation(toEmail, entries, concern, concernNote) {
  const dateList = entries.map(e => e.date).join(', ');
  const subject = concern ? 'A note from mira' : 'Logged ✓';
  const body = concern
    ? `<p>Thanks for writing. Based on what you shared, this might be worth a conversation with a doctor${concernNote ? ` — ${concernNote}` : ''}. I've still saved the date(s) you mentioned (${dateList}) to your diary.</p>
       <p style="font-size:12px;color:#8a8175">If this ever feels urgent, please don't wait — contact a doctor, a trusted person, or local emergency services.</p>
       <p style="font-size:12px;color:#8a8175">Your original message was not stored — only the date(s) above.</p>`
    : `<p>Got it — saved ${entries.length > 1 ? `${entries.length} entries` : 'this'} to your diary (${dateList}).</p>
       <p style="font-size:12px;color:#8a8175">Your message text was not stored — only the date and category above. It still lives in your own Sent folder.</p>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'mira <hello@mira.diary>',
      to: toEmail,
      subject,
      html: body
    })
  });
}

module.exports =
