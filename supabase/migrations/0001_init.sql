create extension if not exists "pgcrypto";

create type visibility_type as enum ('public','pro','private');
create type signal_classification_type as enum ('Structural Trigger','Early Intervention / Quiet Signal');
create type follow_up_status_type as enum ('open','in_progress','resolved','not_actionable');
create type follow_up_channel_type as enum ('email','call','text','linkedin','internal','other');

create table if not exists admin_users (
  email text primary key,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  report_date date unique not null,
  title text not null,
  raw_text text not null,
  parsed_json jsonb not null,
  html_cache text,
  is_published boolean not null default false,
  visibility visibility_type not null default 'private',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  company_name text not null,
  sponsor_name text not null,
  headline text not null,
  signal_detected boolean not null,
  classification signal_classification_type not null,
  primary_trigger_category text not null,
  secondary_triggers text,
  confidence_score int not null check (confidence_score between 1 and 5),
  merits_outreach boolean not null,
  outreach_reasoning text,
  potential_for_transformation text,
  evidence_bullets jsonb not null default '[]'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  ref_number int not null,
  title text not null,
  url text,
  domain text,
  created_at timestamptz default now(),
  unique (report_id, ref_number)
);

create table if not exists outreach_recommendations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  company_name text not null,
  sponsor_name text not null,
  trigger_type text not null,
  confidence_score int not null,
  created_at timestamptz default now()
);

create table if not exists follow_up_state (
  signal_id uuid primary key references signals(id) on delete cascade,
  status follow_up_status_type not null default 'open',
  resolved_at timestamptz,
  resolution_notes text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists follow_up_actions (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references signals(id) on delete cascade,
  created_at timestamptz default now(),
  action_date date default current_date,
  contact_name text,
  contact_org text,
  channel follow_up_channel_type not null default 'other',
  notes text not null
);

create or replace function is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from admin_users where email = auth.jwt()->>'email'
  );
$$;

alter table reports enable row level security;
alter table signals enable row level security;
alter table sources enable row level security;
alter table outreach_recommendations enable row level security;
alter table follow_up_state enable row level security;
alter table follow_up_actions enable row level security;
alter table admin_users enable row level security;

create policy public_read_reports on reports for select using (is_published and visibility = 'public');
create policy admin_all_reports on reports for all using (is_admin()) with check (is_admin());

create policy public_read_signals on signals for select using (exists (select 1 from reports r where r.id = signals.report_id and r.is_published and r.visibility='public'));
create policy admin_all_signals on signals for all using (is_admin()) with check (is_admin());

create policy public_read_sources on sources for select using (exists (select 1 from reports r where r.id = sources.report_id and r.is_published and r.visibility='public'));
create policy admin_all_sources on sources for all using (is_admin()) with check (is_admin());

create policy public_read_outreach on outreach_recommendations for select using (exists (select 1 from reports r where r.id = outreach_recommendations.report_id and r.is_published and r.visibility='public'));
create policy admin_all_outreach on outreach_recommendations for all using (is_admin()) with check (is_admin());

create policy admin_all_follow_up_state on follow_up_state for all using (is_admin()) with check (is_admin());
create policy admin_all_follow_up_actions on follow_up_actions for all using (is_admin()) with check (is_admin());
create policy admin_manage_allowlist on admin_users for all using (is_admin()) with check (is_admin());
