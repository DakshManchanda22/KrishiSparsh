-- Store Gemini bill scan results for "Past bills" in expense scanner
create table if not exists public.bill_scans (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table public.bill_scans enable row level security;

create policy "Allow all for bill_scans"
  on public.bill_scans for all
  using (true)
  with check (true);

create index if not exists bill_scans_created_at_idx on public.bill_scans (created_at desc);
create index if not exists bill_scans_user_created_idx on public.bill_scans (user_id, created_at desc);
