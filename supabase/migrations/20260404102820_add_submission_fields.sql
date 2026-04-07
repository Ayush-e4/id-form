create table if not exists public.submissions (
  id text primary key,
  name text not null,
  phone text not null default '',
  "photoUrl" text,
  "photoKey" text,
  "submittedAt" timestamptz not null default now(),
  type text not null default 'plant' check (type in ('plant', 'school')),
  "plantSlug" text,
  "plantName" text,
  "schoolSlug" text,
  "schoolName" text,
  "fathersName" text,
  "mothersName" text,
  class text,
  dob date,
  address text,
  "rollNo" text,
  "admissionNo" text,
  height text,
  weight text,
  "bloodGroup" text,
  "houseName" text
);

alter table public.submissions
  add column if not exists type text not null default 'plant',
  add column if not exists "photoUrl" text,
  add column if not exists "photoKey" text,
  add column if not exists "submittedAt" timestamptz not null default now(),
  add column if not exists "plantSlug" text,
  add column if not exists "plantName" text,
  add column if not exists "schoolSlug" text,
  add column if not exists "schoolName" text,
  add column if not exists "fathersName" text,
  add column if not exists "mothersName" text,
  add column if not exists class text,
  add column if not exists dob date,
  add column if not exists address text,
  add column if not exists "rollNo" text,
  add column if not exists "admissionNo" text,
  add column if not exists height text,
  add column if not exists weight text,
  add column if not exists "bloodGroup" text,
  add column if not exists "houseName" text;

do $$
begin
  update public.submissions
  set "plantSlug" = 'bml-plant',
      "plantName" = 'BML Plant'
  where type = 'plant'
    and (coalesce("plantSlug", '') = '' or coalesce("plantName", '') = '');

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'plantslug'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'plantSlug'
  ) then
    alter table public.submissions rename column plantslug to "plantSlug";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'plantname'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'plantName'
  ) then
    alter table public.submissions rename column plantname to "plantName";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'photourl'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'photoUrl'
  ) then
    alter table public.submissions rename column photourl to "photoUrl";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'submittedat'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'submittedAt'
  ) then
    alter table public.submissions rename column submittedat to "submittedAt";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'schoolslug'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'schoolSlug'
  ) then
    alter table public.submissions rename column schoolslug to "schoolSlug";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'schoolname'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'schoolName'
  ) then
    alter table public.submissions rename column schoolname to "schoolName";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'fathersname'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'fathersName'
  ) then
    alter table public.submissions rename column fathersname to "fathersName";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'mothersname'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'mothersName'
  ) then
    alter table public.submissions rename column mothersname to "mothersName";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'rollno'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'rollNo'
  ) then
    alter table public.submissions rename column rollno to "rollNo";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'admissionno'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'admissionNo'
  ) then
    alter table public.submissions rename column admissionno to "admissionNo";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'bloodgroup'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'bloodGroup'
  ) then
    alter table public.submissions rename column bloodgroup to "bloodGroup";
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'housename'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'houseName'
  ) then
    alter table public.submissions rename column housename to "houseName";
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_type_check'
  ) then
    alter table public.submissions
      add constraint submissions_type_check
      check (type in ('plant', 'school'));
  end if;
end $$;

create index if not exists submissions_submitted_at_idx
  on public.submissions ("submittedAt" desc);

create index if not exists submissions_type_idx
  on public.submissions (type);

create index if not exists submissions_school_slug_idx
  on public.submissions ("schoolSlug");

create index if not exists submissions_plant_slug_idx
  on public.submissions ("plantSlug");

create index if not exists submissions_phone_idx
  on public.submissions (phone);
