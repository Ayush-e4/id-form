create table if not exists public.submissions (
  id text primary key,
  name text not null,
  phone text not null default '',
  photoUrl text,
  submittedAt timestamptz not null default now(),
  type text not null default 'plant' check (type in ('plant', 'school')),
  fathersName text,
  mothersName text,
  class text,
  dob date,
  address text,
  rollNo text,
  admissionNo text,
  height text,
  weight text,
  bloodGroup text,
  houseName text
);

alter table public.submissions
  add column if not exists type text not null default 'plant',
  add column if not exists fathersName text,
  add column if not exists mothersName text,
  add column if not exists class text,
  add column if not exists dob date,
  add column if not exists address text,
  add column if not exists rollNo text,
  add column if not exists admissionNo text,
  add column if not exists height text,
  add column if not exists weight text,
  add column if not exists bloodGroup text,
  add column if not exists houseName text;

do $$
begin
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
