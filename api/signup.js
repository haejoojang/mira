// api/signup.js
// Vercel serverless function. Receives a POST from the signup form,
// validates input, calculates the user's cycle prediction, and sends
// a welcome email via Resend.
//
// For v0.1 we store nothing — this is a stateless calculation + email.
// v0.2 will add a database (Supabase) so we can run the daily cron.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- email copy in three languages -------------------------------------------
// Kept in this file for v0.1 simplicity. Will move to /locales in v0.2.

const emailCopy = {
  en: {
    subject: "Your Mira cycle view",
    greeting: "Hello,",
    intro: "Here is the calendar view of your next expected cycle. Mira stays quiet until the dates below.",
    label_next_period: "Next period (estimated)",
    label_fertile: "Fertile window (estimated)",
    label_ovulation: "Ovulation day (estimated)",
    disclaimer_title: "Please read",
    disclaimer: "These dates are arithmetic estimates based on the cycle length you gave us. They are not a contraception method, not a fertility-planning method, and not a medical diagnosis. Cycles vary. If you are trying to conceive, avoid conception, or have concerns, please speak to a clinician.",
    footer_manage: "Manage or delete your data",
    footer_resources: "Resources",
    sign_off: "Quietly,\nMira",
  },
  ko: {
    subject: "Mira 주기 안내",
    greeting: "안녕하세요,",
    intro: "다음 예상 주기를 캘린더 형식으로 안내드립니다. Mira는 아래 날짜까지 조용히 기다립니다.",
    label_next_period: "다음 생리 (예상)",
    label_fertile: "가임기 (예상)",
    label_ovulation: "배란일 (예상)",
    disclaimer_title: "꼭 읽어주세요",
    disclaimer: "이 날짜들은 알려주신 주기 길이를 바탕으로 한 산술적 추정치입니다. 피임 수단도, 임신 계획 수단도, 의학적 진단도 아닙니다. 주기는 사람마다 다릅니다. 임신을 시도하거나 피하려 하거나 걱정되는 점이 있다면 의료진과 상담하세요.",
    footer_manage: "데이터 관리 또는 삭제",
    footer_resources: "자료",
    sign_off: "조용히,\nMira 드림",
  },
  ar: {
    subject: "عرض دورتك من ميرا",
    greeting: "مرحبًا،",
    intro: "إليك عرضًا تقويميًا لدورتك المتوقعة القادمة. ستبقى ميرا هادئة حتى التواريخ أدناه.",
    label_next_period: "الدورة القادمة (تقدير)",
    label_fertile: "نافذة الخصوبة (تقدير)",
    label_ovulation: "يوم الإباضة (تقدير)",
    disclaimer_title: "يرجى القراءة",
    disclaimer: "هذه التواريخ تقديرات حسابية بناءً على طول الدورة الذي قدمتيه. ليست وسيلة لمنع الحمل، ولا وسيلة لتنظيمه، ولا تشخيصًا طبيًا. الدورات تختلف. إذا كنت تحاولين الحمل أو تجنبه أو لديك مخاوف، يرجى التحدث مع طبيب.",
    footer_manage: "إدارة بياناتك أو حذفها",
    footer_resources: "موارد",
    sign_off: "بهدوء،\nميرا",
  },
};

// --- cycle math --------------------------------------------------------------
// Standard calendar-method estimates. We are deliberately conservative:
// fertile window is 5 days before ovulation through ovulation day.
// Ovulation is estimated at (cycle_length - 14) days after last period start.

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr + "T00:00:00Z");
  const locale = lang === "ko" ? "ko-KR" : lang === "ar" ? "ar-EG" : "en-GB";
  return d.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function calculateCycle(lastPeriod, cycleLength) {
  const ovulationOffset = cycleLength - 14;
  const ovulationDay = addDays(lastPeriod, ovulationOffset);
  const fertileStart = addDays(lastPeriod, ovulationOffset - 5);
  const fertileEnd = ovulationDay; // inclusive of ovulation day
  const nextPeriod = addDays(lastPeriod, cycleLength);
  return { fertileStart, fertileEnd, ovulationDay, nextPeriod };
}

// --- email rendering ---------------------------------------------------------

function renderEmail({ cycle, lang }) {
  const t = emailCopy[lang] || emailCopy.en;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; background: #fafaf7; color: #1a1a1a; margin: 0; padding: 2rem;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
    <tr><td>
      <div style="font-size: 1.4rem; letter-spacing: 0.3em; margin-bottom: 2rem;">MIRA</div>
      <p style="font-size: 1rem; margin-bottom: 1.5rem;">${t.greeting}</p>
      <p style="font-size: 0.95rem; color: #4a4a4a; margin-bottom: 2rem; line-height: 1.6;">${t.intro}</p>

      <div style="border-top: 1px solid #e5e3dd; padding-top: 1.5rem; margin-bottom: 1.5rem;">
        <div style="font-family: sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #6a6a6a; margin-bottom: 0.4rem;">${t.label_fertile}</div>
        <div style="font-size: 1rem; margin-bottom: 1.2rem;">${formatDate(cycle.fertileStart, lang)} — ${formatDate(cycle.fertileEnd, lang)}</div>

        <div style="font-family: sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #6a6a6a; margin-bottom: 0.4rem;">${t.label_ovulation}</div>
        <div style="font-size: 1rem; margin-bottom: 1.2rem;">${formatDate(cycle.ovulationDay, lang)}</div>

        <div style="font-family: sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #6a6a6a; margin-bottom: 0.4rem;">${t.label_next_period}</div>
        <div style="font-size: 1rem;">${formatDate(cycle.nextPeriod, lang)}</div>
      </div>

      <div style="background: rgba(0,0,0,0.03); padding: 1rem; border-radius: 2px; font-size: 0.8rem; color: #4a4a4a; margin-bottom: 2rem;">
        <strong>${t.disclaimer_title}.</strong> ${t.disclaimer}
      </div>

      <p style="font-size: 0.95rem; white-space: pre-line; margin-bottom: 2rem;">${t.sign_off}</p>

      <div style="border-top: 1px solid #e5e3dd; padding-top: 1rem; font-family: sans-serif; font-size: 0.7rem; color: #6a6a6a;">
        <a href="https://mira.example.com/manage" style="color: #6a6a6a; margin-right: 1rem;">${t.footer_manage}</a>
        <a href="https://mira.example.com/resources" style="color: #6a6a6a;">${t.footer_resources}</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

// --- request handler ---------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, last_period, cycle_length, lead_time, partner_email, language } = req.body || {};

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (!last_period || !/^\d{4}-\d{2}-\d{2}$/.test(last_period)) {
    return res.status(400).json({ error: "Invalid date" });
  }
  const cycle = parseInt(cycle_length, 10);
  if (!cycle || cycle < 21 || cycle > 35) {
    return res.status(400).json({ error: "Cycle length must be between 21 and 35" });
  }
  const lead = parseInt(lead_time, 10);
  if (![1, 3, 5, 7].includes(lead)) {
    return res.status(400).json({ error: "Invalid lead time" });
  }
  const lang = ["en", "ko", "ar"].includes(language) ? language : "en";

  // Reject future dates and dates older than a year
  const periodDate = new Date(last_period + "T00:00:00Z");
  const now = new Date();
  if (periodDate > now) {
    return res.status(400).json({ error: "Last period date cannot be in the future" });
  }
  const oneYearAgo = new Date(now);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  if (periodDate < oneYearAgo) {
    return res.status(400).json({ error: "Last period date is too far in the past" });
  }

  const cycleDates = calculateCycle(last_period, cycle);
  const html = renderEmail({ cycle: cycleDates, lang });
  const subject = (emailCopy[lang] || emailCopy.en).subject;

  try {
    await resend.emails.send({
      from: process.env.MIRA_FROM_EMAIL || "Mira <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Email send failed" });
  }

  // partner_email and lead_time are accepted but unused in v0.1.
  // v0.2 will store them in Supabase and use them in the daily cron.

  return res.status(200).json({ ok: true });
}
