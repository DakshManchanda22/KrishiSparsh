-- Expense Scanner: store extracted bill data
-- Run once via: supabase db push (or run this in SQL Editor)

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  amount decimal(12,2) not null,
  category text not null check (category in ('fertilizer', 'seed', 'labour', 'pesticide', 'transport', 'other')),
  raw_text text,
  created_at timestamptz default now()
);

-- Allow anon/authenticated to insert and select (RLS can be tightened later)
alter table public.expenses enable row level security;

create policy "Allow anon read and insert expenses"
  on public.expenses for all
  using (true)
  with check (true);

-- Optional: index for current month queries
create index if not exists expenses_created_at_idx on public.expenses (created_at desc);
create index if not exists expenses_user_created_idx on public.expenses (user_id, created_at desc);
