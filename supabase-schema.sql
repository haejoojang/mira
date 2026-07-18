-- Mira v1 — minimal schema. Run this once in the Supabase SQL editor.
-- Deliberate design: no free-text is ever stored here. Diary text lives only
-- in the user's own inbox; this table holds just what predictions need.

create extension if not exists "uuid-ossp";

-- One row per user, created automatically on first sign-in via Supabase Auth.
-- calendar_token is a private, unguessable string used for the .ics subscription
-- link (calendar apps can't do magic-link auth, so this is a narrow-scope secret
-- instead — see api/calendar.js).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  calendar_token uuid not null default uuid_generate_v4(),
  reminder_lead_days int not null default 3, -- 1, 3, 5, or 7 per Mira's existing design
  created_at timestamptz not null default now()
);

-- Structured entries only: a date + a short category. No free text.
-- category: 'period_start' | 'period_end' | 'symptom' | 'mood' | 'spotting' | 'medication' | 'sex' | 'other'
create table if not exists cycle_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null,
  category text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cycle_entries_user_date on cycle_entries(user_id, entry_date);

-- Row Level Security: a user can only ever read or write their own rows.
-- This is enforced by the database itself, not just application code.
alter table profiles enable row level security;
alter table cycle_entries enable row level security;

create policy "profiles: read own" on profiles for select using (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

create policy "entries: read own" on cycle_entries for select using (auth.uid() = user_id);
create policy "entries: insert own" on cycle_entries for insert with check (auth.uid() = user_id);
create policy "entries: delete own" on cycle_entries for delete using (auth.uid() = user_id);

-- Auto-create a profile row the moment someone verifies their magic link for the first time.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
