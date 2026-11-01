-- =====================================================================
-- 4. PROGRESS: dars progressi, o'qish vaqti, server funksiyalari
-- =====================================================================
-- Talaba progressni to'g'ridan-to'g'ri yoza olmaydi: faqat quyidagi
-- funksiyalar orqali, ular har bir qadamni tekshiradi (qadam o'tkazib
-- yuborish, video ko'rilmasdan tugatish va h.k. mumkin emas).

create type public.progress_status as enum ('in_progress', 'completed');

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status public.progress_status not null default 'in_progress',
  current_step smallint not null default 0 check (current_step >= 0),
  max_step_reached smallint not null default 0 check (max_step_reached >= 0),
  video_position_sec integer not null default 0 check (video_position_sec >= 0),
  video_percent smallint not null default 0 check (video_percent between 0 and 100),
  lesson_version integer not null default 1,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, lesson_id),
  constraint lesson_progress_completed_time check ((status = 'completed') = (completed_at is not null))
);
create index lesson_progress_user_seen_idx on public.lesson_progress (user_id, last_seen_at desc);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

create table public.learning_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  local_day date not null,
  seconds integer not null check (seconds between 1 and 120),
  created_at timestamptz not null default now()
);
create index learning_sessions_user_day_idx on public.learning_sessions (user_id, local_day);
create index learning_sessions_user_created_idx on public.learning_sessions (user_id, created_at desc);

alter table public.lesson_progress enable row level security;
alter table public.learning_sessions enable row level security;

create policy "lesson_progress: o'zinikini yoki admin"
  on public.lesson_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "learning_sessions: o'zinikini yoki admin"
  on public.learning_sessions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

revoke all on table public.lesson_progress, public.learning_sessions from anon, authenticated;
grant select on table public.lesson_progress, public.learning_sessions to authenticated;

-- ---------------------------------------------------------------------
-- Ichki tekshiruv: foydalanuvchi kirgan va darsni ko'ra oladi
-- ---------------------------------------------------------------------
create function private.require_lesson_access(p_lesson_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not private.can_view_lesson_content(p_lesson_id) then
    raise exception 'no_access' using errcode = '42501';
  end if;
  return v_user;
end;
$$;
revoke all on function private.require_lesson_access(uuid) from public;

-- ---------------------------------------------------------------------
-- Darsni boshlash (yoki qaytib kirish)
-- ---------------------------------------------------------------------
create function public.start_lesson(p_lesson_id uuid)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_lesson_access(p_lesson_id);
  v_row public.lesson_progress;
begin
  insert into public.student_enrollments (user_id, course_id)
  values (v_user, private.lesson_course_id(p_lesson_id))
  on conflict do nothing;

  insert into public.lesson_progress (user_id, lesson_id, lesson_version)
  select v_user, l.id, l.version from public.lessons l where l.id = p_lesson_id
  on conflict (user_id, lesson_id) do update set last_seen_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Dars bosqichiga o'tish: oldinga faqat bittadan, orqaga istalgancha
-- ---------------------------------------------------------------------
create function public.advance_lesson_step(p_lesson_id uuid, p_step smallint)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_lesson_access(p_lesson_id);
  v_steps integer;
  v_row public.lesson_progress;
begin
  select count(*) into v_steps from public.lesson_content where lesson_id = p_lesson_id;
  if p_step is null or p_step < 0 or p_step >= greatest(v_steps, 1) then
    raise exception 'invalid_step' using errcode = '22023';
  end if;

  update public.lesson_progress
  set current_step = p_step,
      max_step_reached = greatest(max_step_reached, p_step),
      last_seen_at = now()
  where user_id = v_user
    and lesson_id = p_lesson_id
    and p_step <= max_step_reached + 1
  returning * into v_row;

  if not found then
    raise exception 'step_not_allowed' using errcode = '22023';
  end if;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Video pozitsiyasi va ko'rilgan foiz (foiz faqat oshadi)
-- ---------------------------------------------------------------------
create function public.record_video_progress(p_lesson_id uuid, p_position_sec integer, p_percent smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_lesson_access(p_lesson_id);
begin
  update public.lesson_progress
  set video_position_sec = greatest(0, coalesce(p_position_sec, 0)),
      video_percent = greatest(video_percent, least(100, greatest(0, coalesce(p_percent, 0)))),
      last_seen_at = now()
  where user_id = v_user and lesson_id = p_lesson_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Darsni tugatish: admin belgilagan shartlar bajarilgan bo'lsagina
-- ---------------------------------------------------------------------
create function public.complete_lesson(p_lesson_id uuid)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := private.require_lesson_access(p_lesson_id);
  v_rule jsonb;
  v_steps integer;
  v_has_video boolean;
  v_row public.lesson_progress;
begin
  select l.completion_rule into v_rule from public.lessons l where l.id = p_lesson_id;
  select count(*) into v_steps from public.lesson_content where lesson_id = p_lesson_id;
  select exists (
    select 1 from public.lesson_media
    where lesson_id = p_lesson_id and kind = 'video' and status = 'ready'
  ) into v_has_video;

  select * into v_row
  from public.lesson_progress
  where user_id = v_user and lesson_id = p_lesson_id
  for update;

  if not found then
    raise exception 'not_started' using errcode = '22023';
  end if;
  if v_row.status = 'completed' then
    return v_row;
  end if;

  if coalesce((v_rule ->> 'require_all_steps')::boolean, true)
     and v_steps > 0 and v_row.max_step_reached < v_steps - 1 then
    raise exception 'steps_incomplete' using errcode = '22023';
  end if;

  -- Video sharti faqat darsda tayyor video bo'lsa qo'llanadi.
  if v_has_video and v_row.video_percent < coalesce((v_rule ->> 'min_video_percent')::integer, 0) then
    raise exception 'video_incomplete' using errcode = '22023';
  end if;

  update public.lesson_progress
  set status = 'completed', completed_at = now(), last_seen_at = now()
  where user_id = v_user and lesson_id = p_lesson_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- O'qish vaqtini qayd etish (har chaqiruvda ko'pi bilan 120 soniya,
-- 20 soniyadan tez-tez chaqirilsa e'tiborga olinmaydi)
-- ---------------------------------------------------------------------
create function public.record_learning_time(p_lesson_id uuid, p_seconds integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_tz text;
  v_last timestamptz;
  v_lesson uuid := p_lesson_id;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_seconds is null or p_seconds < 1 then
    return;
  end if;
  if v_lesson is not null and not private.can_view_lesson_content(v_lesson) then
    v_lesson := null;
  end if;

  select max(created_at) into v_last from public.learning_sessions where user_id = v_user;
  if v_last is not null and v_last > now() - interval '20 seconds' then
    return;
  end if;

  select timezone into v_tz from public.profiles where id = v_user;

  insert into public.learning_sessions (user_id, lesson_id, local_day, seconds)
  values (
    v_user,
    v_lesson,
    (now() at time zone coalesce(v_tz, 'Asia/Tashkent'))::date,
    least(p_seconds, 120)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Dashboard uchun umumiy holat (RLS bilan ishlaydi: SECURITY INVOKER)
-- ---------------------------------------------------------------------
create function public.my_course_overview(p_course_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select (select auth.uid()) as uid
  ),
  tz as (
    select coalesce(
      (select p.timezone from public.profiles p where p.id = (select uid from me)),
      'Asia/Tashkent'
    ) as name
  ),
  course as (
    select c.id, c.title from public.courses c where c.slug = p_course_slug
  ),
  lessons_all as (
    select l.id, l.title, l.status, l.sort_order, l.is_free_preview,
           m.id as module_id, m.sort_order as module_sort,
           cl.number as level_number, cl.title as level_title
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.course_levels cl on cl.id = m.level_id
    where cl.course_id = (select id from course)
  ),
  prog as (
    select lp.*
    from public.lesson_progress lp
    where lp.user_id = (select uid from me)
      and lp.lesson_id in (select id from lessons_all)
  ),
  access as (
    select private.has_course_access((select id from course)) as ok
  ),
  modules_done as (
    select la.module_id
    from lessons_all la
    left join prog p on p.lesson_id = la.id
    group by la.module_id
    having count(*) > 0 and bool_and(p.status = 'completed')
  ),
  resume as (
    select la.id, la.title, la.level_number
    from prog p
    join lessons_all la on la.id = p.lesson_id
    where p.status = 'in_progress' and la.status = 'published'
    order by p.last_seen_at desc
    limit 1
  ),
  first_open as (
    select la.id, la.title, la.level_number
    from lessons_all la
    left join prog p on p.lesson_id = la.id
    where la.status = 'published'
      and (p.status is null or p.status <> 'completed')
      and (la.is_free_preview or (select ok from access))
    order by la.level_number, la.module_sort, la.sort_order
    limit 1
  ),
  next_lesson as (
    select * from resume
    union all
    select * from first_open where not exists (select 1 from resume)
    limit 1
  ),
  days as (
    select distinct s.local_day as d
    from public.learning_sessions s
    where s.user_id = (select uid from me)
  ),
  ranked as (
    select d, d + (row_number() over (order by d desc))::integer as grp from days
  ),
  latest as (
    select d, grp from ranked order by d desc limit 1
  ),
  today as (
    select (now() at time zone (select name from tz))::date as t
  )
  select jsonb_build_object(
    'course_id', (select id from course),
    'course_title', (select title from course),
    'has_access', coalesce((select ok from access), false),
    'total_lessons', (select count(*) from lessons_all),
    'published_lessons', (select count(*) from lessons_all where status = 'published'),
    'completed_lessons', (select count(*) from prog where status = 'completed'),
    'in_progress_lessons', (select count(*) from prog where status = 'in_progress'),
    'total_modules', (select count(distinct module_id) from lessons_all),
    'completed_modules', (select count(*) from modules_done),
    'current_level', coalesce(
      (select level_number from next_lesson),
      (select min(level_number) from lessons_all)
    ),
    'next_lesson', (select jsonb_build_object('id', id, 'title', title, 'level_number', level_number) from next_lesson),
    'learning_minutes', coalesce((
      select sum(s.seconds) / 60
      from public.learning_sessions s
      where s.user_id = (select uid from me)
    ), 0),
    'streak_days', coalesce((
      select case
        when (select d from latest) >= (select t from today) - 1
          then (select count(*) from ranked where grp = (select grp from latest))
        else 0
      end
    ), 0)
  )
  where exists (select 1 from course);
$$;

-- Funksiyalar faqat kirgan foydalanuvchiga
revoke all on function public.start_lesson(uuid) from public, anon;
revoke all on function public.advance_lesson_step(uuid, smallint) from public, anon;
revoke all on function public.record_video_progress(uuid, integer, smallint) from public, anon;
revoke all on function public.complete_lesson(uuid) from public, anon;
revoke all on function public.record_learning_time(uuid, integer) from public, anon;
revoke all on function public.my_course_overview(text) from public, anon;

grant execute on function public.start_lesson(uuid) to authenticated;
grant execute on function public.advance_lesson_step(uuid, smallint) to authenticated;
grant execute on function public.record_video_progress(uuid, integer, smallint) to authenticated;
grant execute on function public.complete_lesson(uuid) to authenticated;
grant execute on function public.record_learning_time(uuid, integer) to authenticated;
grant execute on function public.my_course_overview(text) to authenticated;

grant execute on function private.require_lesson_access(uuid) to authenticated;
