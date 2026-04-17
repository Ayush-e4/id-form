alter table public.submissions
  add column if not exists "sourceSlug" text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'sourceslug'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'sourceSlug'
  ) then
    alter table public.submissions rename column sourceslug to "sourceSlug";
  end if;
end $$;

update public.submissions
set "sourceSlug" = case
  when coalesce("schoolSlug", '') <> '' then "schoolSlug"
  when coalesce("plantSlug", '') <> '' then "plantSlug"
  else "sourceSlug"
end
where coalesce("sourceSlug", '') = '';

create index if not exists submissions_source_slug_idx
  on public.submissions ("sourceSlug");
