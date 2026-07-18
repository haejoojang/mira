# Mira

> A quiet, privacy-first diary for your body.

Mira is a diary, not a tracker. You log period dates, symptoms, sex, mood, or
anything body-related — by typing, tapping, or simply replying to an email —
and Mira turns that into private cycle predictions. No app to install, no push
notifications, no ads, no data sold.

---

## Who this is for

Two audiences, one product:

- **Women with limited time or resources** — including refugee women who need
  accessible, judgment-free reproductive health information and a way to
  understand their own cycle and birth control without a clinic visit.
- **Busy professional women** who want a discreet, ad-free alternative to
  mainstream trackers — no cute stickers, no gamification, no notifications
  announcing what the app is for to anyone glancing at a phone.

---

## Why "diary," not "tracker"

The name and framing are a deliberate safety choice, not just branding. An
email thread or app called "diary" is safe to have visible on a shared device.
One called "period tracker" or "birth control reminders" can itself put someone
at risk — for a woman in a coercive relationship, that label can be the danger,
not the data. Every design decision in Mira follows from this.

---

## What Mira remembers — and what it doesn't

This is the core of the product, so it's stated plainly:

**Mira keeps:** your email address, and the dates and category of what you log
(period start/end, symptom, mood, spotting, medication, sex). That's what
predictions need.

**Mira does not keep:** what you actually wrote. When you log something — by
typing in the web diary or replying to an email — that text is read once, just
long enough to extract a date and a category, and is never stored, logged, or
reviewed afterward. The full entry lives on in your own inbox, not ours.

This is a different claim than "we encrypt everything." Encryption protects
data from outsiders; it doesn't stop us from reading it. Mira's promise is that
there's nothing detailed to read in the first place — we couldn't hand over
your diary in a breach, because we never had it.

---

## How you use it

- **Type or tap to log.** A search-bar style input in the web diary accepts
  plain sentences ("had sex, no protection," "cramps today") or, for days you
  don't feel like writing, a quiet grid of plain-text buttons — no bright
  colors, no stickers.
- **Reply to any Mira email** to log the same way, from any device, without
  opening the web view at all.
- **Ask questions in the same bar** — "when's my next period," "is today my
  fertile window" — answered from your own computed cycle data.
- **Calendar view** of logged history plus predicted period, fertile window,
  and ovulation.
- **Add to your phone's calendar** (iPhone, Android, Google Calendar) via a
  private subscription link. Events are deliberately vague ("Mira reminder")
  since calendar apps often sync to a cloud outside Mira's control.
- **Pull a clinic-visit summary** — your period history as a clean, printable
  table (start date, end date, duration, cycle length) for a doctor's
  appointment, generated from stored dates only.

---

## What Mira sends you

Event-triggered emails only — never a daily check-in. A reminder before an
expected period or fertile window (lead time you choose: 1/3/5/7 days), and a
brief confirmation right after you log something. Silence otherwise. Frequent
emails from a period-related sender can itself be risky in an unsafe household,
so the inbox stays calm on purpose.

---

## Sharing — owner-initiated only

*(Planned, not yet built.)* A future option will let an account owner invite
someone — a parent, a partner, a trusted person — to see a **view-only**
calendar. Deliberately narrow, to avoid becoming the surveillance mechanism the
rest of Mira is designed to prevent:

- Only the account owner can invite a viewer. A viewer can never request or
  initiate access.
- View-only — a shared viewer never sees diary text, only dates.
- Not retroactive — access starts from the day it's granted, not the full
  history.
- Revocable any time, only by the account owner.

This is separate from the existing **partner alert** feature (below) and won't
be merged into it, since they solve different problems.

---

## Partner alerts (existing)

A user can optionally add a partner's email. The partner receives a separate
consent email first and must confirm before anything else is sent. They then
receive only fertile-window and ovulation alerts — never the period reminder,
and never diary content.

---

## Multilingual

English, Korean, and Arabic (with right-to-left layout). The resources page is
translated first, the signup and diary interface second.

---

## Survivor-safe by design

- Abuse and crisis helpline information lives on a dedicated resources page —
  never inside an email body, where it could be seen by someone else.
- A quick-exit option on the web pages.
- Neutral language throughout — nothing that would alarm someone reading over
  a shoulder.
- Calendar exports use vague event titles, never specifics.

---

## What Mira is not

- Not Flo, Clue, or Glow. Not a fertility-planning tool. Not a contraceptive.
- Not a medical device, and not a replacement for a clinician.
- Not a native app — deliberately. No app-store account, no icon
  advertising what it's for, no push notifications. This may be revisited if
  real demand for a native app emerges, but isn't the starting assumption.
- Not free of error — cycle predictions are estimates from your own history,
  not medicine. Every prediction says so.

---

## Architecture
