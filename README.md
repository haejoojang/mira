# Mira

> A quiet, privacy-first cycle companion.

Mira sends one private email when your cycle expects you. No app to install. No notifications on your phone. No data shared. No symptom logging. No mood tracking. No advertisers.

You give Mira the first day of your last period. Mira sends you a calendar view of what's likely next — and stays quiet until those days arrive.

---

## Why this exists

Mainstream period-tracking apps treat your reproductive health like a data asset: maximalist symptom logging, ad-supported business models, partner-sharing features that turn intimate information into shared property, and visual design that announces *exactly* what the app is doing on your phone.

For most users that's fine. For some users — women in coercive relationships, refugees, women in jurisdictions where reproductive autonomy is contested, women who simply want quiet — it's a real problem.

Mira is the opposite product. It is deliberately minimal. The smallest amount of data, the smallest amount of attention, the smallest amount of trust required.

---

## Design principles

1. **Privacy by default, not by setting.** No symptom logging, no mood tracking, no longitudinal medical record. We store your email, your last period date, your cycle length, your preferred reminder lead time, and your language. Nothing else.
2. **Email-only delivery.** No native app means no app icon on your phone, no push notifications, no app store history. Anyone glancing at your phone sees nothing.
3. **Quiet by default.** After signup, Mira sends three emails per cycle: fertile window start, ovulation day, period reminder. That's it.
4. **Honest about what we can and cannot predict.** Cycle math is arithmetic, not medicine. Every email says so. Mira is not a contraception method and not a fertility-planning tool.
5. **Language barrier free.** English, Korean, and Arabic at launch. Arabic includes right-to-left layout. Resources page translated first, signup form translated second.
6. **Optional partner cc, with consent.** A user can add a partner's email. The partner receives a separate consent email *first* and must confirm before getting anything else. The partner receives only fertile and ovulation alerts — never the period reminder.
7. **Survivor-safe.** Abuse helpline information lives on the resources page, never in the body of emails. The website has a quick-exit button. Emails never contain language that would alarm someone reading over a shoulder.

---

## What Mira is not

- Not Flo. Not Clue. Not Glow. Not a fertility planner. Not a contraceptive.
- Not a medical device.
- Not a replacement for a clinician.
- Not a longitudinal health record.
- Not free of error — calendar-method estimates are approximate. The disclaimer is in every email for a reason.

---

## Architecture (v0.1)

```
public/index.html        Signup form (static, multilingual, RTL-ready)
api/signup.js            Vercel serverless function: validates input,
                         calculates cycle, sends welcome email via Resend
package.json             Dependencies
vercel.json              Vercel config
```

**v0.1 is stateless.** It calculates a user's cycle on the fly and sends one welcome email. There is no database yet.

**v0.2 will add:**
- Supabase for storing signups (so the cron has someone to email)
- A daily cron job (GitHub Actions) that checks who needs an email today
- The three scheduled emails per cycle
- Partner consent flow
- One-click unsubscribe + data deletion
- Privacy notice page
- Resources page

---

## Deploying v0.1

1. Push this repo to GitHub.
2. Sign up at [vercel.com](https://vercel.com) → "New Project" → import this repo.
3. Sign up at [resend.com](https://resend.com) → create an API key.
4. In Vercel project settings → Environment Variables, add:
   - `RESEND_API_KEY` — your Resend API key
   - `MIRA_FROM_EMAIL` — optional; format `"Mira <you@yourdomain.com>"`. If omitted, Resend's testing address is used (which only sends to your verified email).
5. Deploy. Vercel gives you a URL like `mira-xxx.vercel.app`.

To send to real users, you must verify a domain with Resend. Until then, Mira will only deliver to your own verified email — which is the right way to test.

---

## What's deliberately deferred

v0.1 accepts the partner email and lead time from the form but does not yet use them. They are stored only when v0.2 adds a database. This is on purpose: ship the smallest thing that proves the architecture, then layer on.

---

## License

To be decided. Likely MIT for code, CC-BY for translations and copy.
