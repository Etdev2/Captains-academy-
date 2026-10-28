-- Captain's Academy: guest-owned progress and prototype review data.
-- No login screen is required. Guest sessions use auth.uid() for isolation.
begin;

create table public.study_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('mission', 'mastery')),
  resource_id text not null check (char_length(resource_id) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 16384),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, resource_id)
);

create table public.prototype_assets (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  title text not null check (char_length(title) between 1 and 160),
  style text not null check (char_length(style) between 1 and 80),
  category text not null check (char_length(category) between 1 and 80),
  source text not null check (source in ('claude', 'chatgpt', 'other')),
  image_url text not null check (char_length(image_url) <= 2048 and
    (image_url ~ '^https://[^[:space:]]+$' or image_url ~ '^/[^/[:space:]][^[:space:]]*$')),
  description text not null default '' check (char_length(description) <= 2000),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.prototype_feedback (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  prototype_id text not null references public.prototype_assets(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  comment text not null default '' check (char_length(comment) <= 2000),
  reviewer_label text not null default '' check (char_length(reviewer_label) <= 80),
  updated_at timestamptz not null default now(),
  primary key (user_id, prototype_id)
);
create index prototype_feedback_prototype_id_idx on public.prototype_feedback (prototype_id);

create schema if not exists academy_private;
revoke all on schema academy_private from public, anon, authenticated;

create function academy_private.stamp_progress()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  if tg_op = 'UPDATE' then
    new.revision = old.revision + 1;
  else
    new.revision = 1;
  end if;
  return new;
end;
$$;
revoke all on function academy_private.stamp_progress() from public, anon, authenticated;
create trigger stamp_study_progress before insert or update on public.study_progress
for each row execute function academy_private.stamp_progress();

create function academy_private.stamp_feedback()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function academy_private.stamp_feedback() from public, anon, authenticated;
create trigger stamp_prototype_feedback before insert or update on public.prototype_feedback
for each row execute function academy_private.stamp_feedback();

alter table public.study_progress enable row level security;
alter table public.prototype_assets enable row level security;
alter table public.prototype_feedback enable row level security;

revoke all on public.study_progress, public.prototype_assets, public.prototype_feedback from anon, authenticated;
grant select on public.prototype_assets to anon, authenticated;
grant select, insert, update, delete on public.study_progress, public.prototype_feedback to authenticated;

create policy published_prototypes on public.prototype_assets for select to anon, authenticated
using (published);

create policy own_progress_select on public.study_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy own_progress_insert on public.study_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy own_progress_update on public.study_progress for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_progress_delete on public.study_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create policy own_feedback_select on public.prototype_feedback for select to authenticated
using ((select auth.uid()) = user_id);
create policy own_feedback_insert on public.prototype_feedback for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.prototype_assets p where p.id = prototype_id and p.published
));
create policy own_feedback_update on public.prototype_feedback for update to authenticated
using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.prototype_assets p where p.id = prototype_id and p.published
  )
);
create policy own_feedback_delete on public.prototype_feedback for delete to authenticated
using ((select auth.uid()) = user_id);
commit;
