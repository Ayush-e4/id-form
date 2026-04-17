create table if not exists public.submissions (
  id text primary key,
  name text not null,
  phone text not null default '',
  "photoUrl" text,
  "photoKey" text,
  "submittedAt" timestamptz not null default now(),
  type text not null default 'plant' check (type in ('plant', 'school')),
  "sourceSlug" text,
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
  add column if not exists "sourceSlug" text,
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
  set "sourceSlug" = case
    when coalesce("schoolSlug", '') <> '' then "schoolSlug"
    when coalesce("plantSlug", '') <> '' then "plantSlug"
    else "sourceSlug"
  end
  where coalesce("sourceSlug", '') = '';

  update public.submissions
  set "plantSlug" = 'bml-plant',
      "plantName" = 'BML Plant'
  where type = 'plant'
    and (coalesce("plantSlug", '') = '' or coalesce("plantName", '') = '');

  update public.submissions
  set
    "schoolSlug" = case lower(trim(coalesce("schoolName", '')))
      when 'uhs chokad' then 'uhs-chokad'
      when 'modern public school' then 'modern-public-school'
      when 'sanskaar play school' then 'sanskaar-play-school'
      when 'gokul public school' then 'gokul-public-school'
      when 'st. francis academy' then 'st-francis-academy'
      when 'golden public school' then 'golden-public-school'
      when 'ddrp public school' then 'ddrp-public-school'
      when 'children paradise school' then 'children-paradise-school'
      when 'janta high school' then 'janta-high-school'
      when '3dd public school' then '3dd-public-school'
      when 'high school dimra' then 'high-school-dimra'
      when 'jyoti play school' then 'jyoti-play-school'
      when 'pits garden academy' then 'pits-garden-academy'
      when 'gajadhar public school' then 'gajadhar-public-school'
      when 'lord gautam vidya mandir' then 'lord-gautam-vidya-mandir'
      when 'uhs nawadih' then 'uhs-nawadih'
      when 'om shanti sishu mandir' then 'om-shanti-sishu-mandir'
      when 'kids garden school' then 'kids-garden-school'
      when 'aman vidya mandir' then 'aman-vidya-mandir'
      when 'chaitanya international school' then 'chaitanya-international-school'
      when 'dp public school' then 'dp-public-school'
      when 'srijan academy' then 'srijan-academy'
      when 'little flower school' then 'little-flower-school'
      when 'jahanvi vidya mandir' then 'jahanvi-vidya-mandir'
      when 'kiran baby paradise' then 'kiran-baby-paradise'
      else "schoolSlug"
    end,
    "schoolName" = case
      when coalesce("schoolSlug", '') = 'uhs-chokad' then 'UHS Chokad'
      when coalesce("schoolSlug", '') = 'modern-public-school' then 'Modern Public School'
      when coalesce("schoolSlug", '') = 'sanskaar-play-school' then 'Sanskaar Play School'
      when coalesce("schoolSlug", '') = 'gokul-public-school' then 'Gokul Public School'
      when coalesce("schoolSlug", '') = 'st-francis-academy' then 'St. Francis Academy'
      when coalesce("schoolSlug", '') = 'golden-public-school' then 'Golden Public School'
      when coalesce("schoolSlug", '') = 'ddrp-public-school' then 'DDRP Public School'
      when coalesce("schoolSlug", '') = 'children-paradise-school' then 'Children Paradise School'
      when coalesce("schoolSlug", '') = 'janta-high-school' then 'Janta High School'
      when coalesce("schoolSlug", '') = '3dd-public-school' then '3DD Public School'
      when coalesce("schoolSlug", '') = 'high-school-dimra' then 'High School Dimra'
      when coalesce("schoolSlug", '') = 'jyoti-play-school' then 'Jyoti Play School'
      when coalesce("schoolSlug", '') = 'pits-garden-academy' then 'Pits Garden Academy'
      when coalesce("schoolSlug", '') = 'gajadhar-public-school' then 'Gajadhar Public School'
      when coalesce("schoolSlug", '') = 'lord-gautam-vidya-mandir' then 'Lord Gautam Vidya Mandir'
      when coalesce("schoolSlug", '') = 'uhs-nawadih' then 'UHS Nawadih'
      when coalesce("schoolSlug", '') = 'om-shanti-sishu-mandir' then 'Om Shanti Sishu Mandir'
      when coalesce("schoolSlug", '') = 'kids-garden-school' then 'Kids Garden School'
      when coalesce("schoolSlug", '') = 'aman-vidya-mandir' then 'Aman Vidya Mandir'
      when coalesce("schoolSlug", '') = 'chaitanya-international-school' then 'Chaitanya International School'
      when coalesce("schoolSlug", '') = 'dp-public-school' then 'DP Public School'
      when coalesce("schoolSlug", '') = 'srijan-academy' then 'Srijan Academy'
      when coalesce("schoolSlug", '') = 'little-flower-school' then 'Little Flower School'
      when coalesce("schoolSlug", '') = 'jahanvi-vidya-mandir' then 'Jahanvi Vidya Mandir'
      when coalesce("schoolSlug", '') = 'kiran-baby-paradise' then 'Kiran Baby Paradise'
      else "schoolName"
    end
  where type = 'school'
    and (coalesce("schoolSlug", '') = '' or coalesce("schoolName", '') = '');

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'sourceslug'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submissions' and column_name = 'sourceSlug'
  ) then
    alter table public.submissions rename column sourceslug to "sourceSlug";
  end if;

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

create index if not exists submissions_source_slug_idx
  on public.submissions ("sourceSlug");

create index if not exists submissions_school_slug_idx
  on public.submissions ("schoolSlug");

create index if not exists submissions_plant_slug_idx
  on public.submissions ("plantSlug");

create index if not exists submissions_phone_idx
  on public.submissions (phone);
