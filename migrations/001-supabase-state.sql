-- Run once in the SQL editor of a dedicated free Rasid Supabase project.
-- No anonymous/client access. The service key stays in Render environment only.
create table if not exists public.rasid_state (
 id text primary key check (id='main'),
 payload jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.rasid_state enable row level security;
revoke all on public.rasid_state from anon, authenticated;
grant select on public.rasid_state to service_role;
create or replace function public.rasid_save_state(expected_revision bigint,new_payload jsonb)
returns bigint language plpgsql security definer set search_path=public as $$
declare next_revision bigint;
begin
 if expected_revision=0 then
  insert into public.rasid_state(id,payload,revision) values('main',new_payload,1) on conflict do nothing returning revision into next_revision;
 else
  update public.rasid_state set payload=new_payload,revision=revision+1,updated_at=now() where id='main' and revision=expected_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'revision_conflict' using errcode='40001'; end if;
 return next_revision;
end $$;
revoke all on function public.rasid_save_state(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.rasid_save_state(bigint,jsonb) to service_role;
