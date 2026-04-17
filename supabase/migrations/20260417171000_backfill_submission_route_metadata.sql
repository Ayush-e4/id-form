alter table public.submissions
  add column if not exists "photoKey" text,
  add column if not exists "plantSlug" text,
  add column if not exists "plantName" text,
  add column if not exists "schoolSlug" text,
  add column if not exists "schoolName" text;

do $$
begin
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
end $$;

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
  and (
    coalesce("schoolSlug", '') = ''
    or coalesce("schoolName", '') = ''
  );

update public.submissions
set
  "plantSlug" = case lower(trim(coalesce("plantName", '')))
    when 'bml plant' then 'bml-plant'
    else "plantSlug"
  end,
  "plantName" = case
    when coalesce("plantSlug", '') = 'bml-plant' then 'BML Plant'
    else "plantName"
  end
where type = 'plant'
  and (
    coalesce("plantSlug", '') = ''
    or coalesce("plantName", '') = ''
  );

create index if not exists submissions_school_slug_idx
  on public.submissions ("schoolSlug");

create index if not exists submissions_plant_slug_idx
  on public.submissions ("plantSlug");
