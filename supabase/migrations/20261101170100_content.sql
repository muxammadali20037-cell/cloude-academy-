-- =====================================================================
-- 2. KONTENT: kurs → daraja → modul → dars → dars bo'limlari va media
-- =====================================================================
-- Holatlar:
--   planned   — dasturda e'lon qilingan, mazmuni hali yo'q (nomi ochiq ko'rinadi)
--   draft     — tayyorlanmoqda (faqat muharrirlar ko'radi)
--   review    — tekshiruvda, masalan AI yozgan matn (faqat muharrirlar)
--   published — talabalar ochishi mumkin
--   archived  — eskirgan, yashirin

create type public.content_status as enum ('planned', 'draft', 'review', 'published', 'archived');

-- Darsning 10 qismi (topshiriqning 8-bo'limi)
create type public.lesson_step_kind as enum (
  'video', 'voice', 'text', 'visual', 'task', 'exercise', 'review', 'mistakes', 'quiz', 'next'
);

create type public.media_kind as enum ('video', 'audio', 'avatar');
create type public.media_status as enum ('processing', 'ready', 'failed');

-- ---------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 160),
  subtitle text,
  description text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  number smallint not null check (number between 0 and 9),
  title text not null check (char_length(title) between 2 and 160),
  description text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, number)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.course_levels (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index modules_level_order_idx on public.modules (level_id, sort_order);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  summary text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  is_free_preview boolean not null default false,
  estimated_minutes smallint check (estimated_minutes is null or estimated_minutes between 1 and 600),
  -- Dars qachon "tugatilgan" hisoblanadi (admin belgilaydi, kod emas).
  completion_rule jsonb not null default '{"min_video_percent": 80, "require_all_steps": true}'::jsonb,
  -- Kontent dolzarbligi: manbalar, tekshirilgan sana, keyingi tekshiruv.
  source_urls text[] not null default '{}',
  verified_at timestamptz,
  review_due_at timestamptz,
  version integer not null default 1 check (version >= 1),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_module_order_idx on public.lessons (module_id, sort_order);
create index lessons_free_preview_idx on public.lessons (is_free_preview) where is_free_preview;

-- Darsning har bir bo'limi (dars yo'lidagi bitta qadam).
create table public.lesson_content (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  kind public.lesson_step_kind not null,
  sort_order smallint not null check (sort_order >= 0),
  title text not null check (char_length(title) between 2 and 160),
  body_md text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, sort_order)
);

create table public.lesson_media (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  kind public.media_kind not null,
  provider text not null,
  provider_asset_id text,
  playback_id text,
  subtitle_url text,
  transcript text,
  duration_sec integer check (duration_sec is null or duration_sec > 0),
  language text not null default 'uz',
  voice text,
  script_hash text,
  version integer not null default 1 check (version >= 1),
  status public.media_status not null default 'processing',
  chapters jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_media_lesson_idx on public.lesson_media (lesson_id);

-- Content Manager'ga biriktirilgan kurslar.
create table public.content_assignments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
create index content_assignments_course_idx on public.content_assignments (course_id);

-- updated_at triggerlari
create trigger courses_set_updated_at before update on public.courses
  for each row execute function private.set_updated_at();
create trigger course_levels_set_updated_at before update on public.course_levels
  for each row execute function private.set_updated_at();
create trigger modules_set_updated_at before update on public.modules
  for each row execute function private.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
  for each row execute function private.set_updated_at();
create trigger lesson_content_set_updated_at before update on public.lesson_content
  for each row execute function private.set_updated_at();
create trigger lesson_media_set_updated_at before update on public.lesson_media
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Yordamchi funksiyalar
-- ---------------------------------------------------------------------
create function private.lesson_course_id(p_lesson_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cl.course_id
  from public.lessons l
  join public.modules m on m.id = l.module_id
  join public.course_levels cl on cl.id = m.level_id
  where l.id = p_lesson_id;
$$;

create function private.module_course_id(p_module_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cl.course_id
  from public.modules m
  join public.course_levels cl on cl.id = m.level_id
  where m.id = p_module_id;
$$;

create function private.level_course_id(p_level_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cl.course_id from public.course_levels cl where cl.id = p_level_id;
$$;

-- Admin yoki shu kursga biriktirilgan Content Manager
create function private.can_edit_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or (
      private.has_role('content_manager')
      and exists (
        select 1 from public.content_assignments ca
        where ca.user_id = (select auth.uid()) and ca.course_id = p_course_id
      )
    );
$$;

-- Ochiq ko'rinadigan holatlar: e'lon qilingan yoki nashr qilingan
create function private.is_public_status(s public.content_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select s in ('planned', 'published');
$$;

revoke all on function private.lesson_course_id(uuid) from public;
revoke all on function private.module_course_id(uuid) from public;
revoke all on function private.level_course_id(uuid) from public;
revoke all on function private.can_edit_course(uuid) from public;
grant execute on function private.lesson_course_id(uuid) to anon, authenticated, service_role;
grant execute on function private.module_course_id(uuid) to anon, authenticated, service_role;
grant execute on function private.level_course_id(uuid) to anon, authenticated, service_role;
grant execute on function private.can_edit_course(uuid) to anon, authenticated, service_role;
grant execute on function private.is_public_status(public.content_status) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.course_levels enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_content enable row level security;
alter table public.lesson_media enable row level security;
alter table public.content_assignments enable row level security;

-- Kurs tuzilmasi (nomlar) — hamma ko'radi, agar e'lon qilingan bo'lsa.
-- Ota element ham ko'rinishi shart: ichki so'rov ota jadvalning RLS'idan o'tadi.
create policy "courses: ochiq yoki muharrir"
  on public.courses for select to anon, authenticated
  using (private.is_public_status(status) or (select private.can_edit_course(id)));

create policy "course_levels: ochiq yoki muharrir"
  on public.course_levels for select to anon, authenticated
  using (
    (private.is_public_status(status)
      and exists (select 1 from public.courses c where c.id = course_id))
    or (select private.can_edit_course(course_id))
  );

create policy "modules: ochiq yoki muharrir"
  on public.modules for select to anon, authenticated
  using (
    (private.is_public_status(status)
      and exists (select 1 from public.course_levels cl where cl.id = level_id))
    or (select private.can_edit_course(private.module_course_id(id)))
  );

create policy "lessons: ochiq yoki muharrir"
  on public.lessons for select to anon, authenticated
  using (
    (private.is_public_status(status)
      and exists (select 1 from public.modules m where m.id = module_id))
    or (select private.can_edit_course(private.lesson_course_id(id)))
  );

-- Muharrirlar uchun yozish (CMS — 7-faza). Kurs yaratish faqat admin.
create policy "courses: admin yaratadi"
  on public.courses for insert to authenticated
  with check ((select private.is_admin()));
create policy "courses: muharrir tahrirlaydi"
  on public.courses for update to authenticated
  using ((select private.can_edit_course(id)))
  with check ((select private.can_edit_course(id)));
create policy "courses: admin o'chiradi"
  on public.courses for delete to authenticated
  using ((select private.is_admin()));

create policy "course_levels: muharrir yozadi"
  on public.course_levels for all to authenticated
  using ((select private.can_edit_course(course_id)))
  with check ((select private.can_edit_course(course_id)));

create policy "modules: muharrir yozadi"
  on public.modules for all to authenticated
  using ((select private.can_edit_course(private.level_course_id(level_id))))
  with check ((select private.can_edit_course(private.level_course_id(level_id))));

create policy "lessons: muharrir yozadi"
  on public.lessons for all to authenticated
  using ((select private.can_edit_course(private.module_course_id(module_id))))
  with check ((select private.can_edit_course(private.module_course_id(module_id))));

-- Dars mazmuni va media: faqat nashr qilingan dars, va bepul yoki kirish huquqi bor.
-- has_course_access 3-migratsiyada yaratiladi; bu qoidalar o'sha yerda qo'shiladi.

create policy "lesson_content: muharrir yozadi"
  on public.lesson_content for all to authenticated
  using ((select private.can_edit_course(private.lesson_course_id(lesson_id))))
  with check ((select private.can_edit_course(private.lesson_course_id(lesson_id))));

create policy "lesson_media: muharrir yozadi"
  on public.lesson_media for all to authenticated
  using ((select private.can_edit_course(private.lesson_course_id(lesson_id))))
  with check ((select private.can_edit_course(private.lesson_course_id(lesson_id))));

create policy "content_assignments: o'zinikini yoki admin"
  on public.content_assignments for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Huquqlar: anon faqat o'qiydi; yozish RLS orqali faqat muharrirlarga.
revoke all on table public.courses, public.course_levels, public.modules, public.lessons,
  public.lesson_content, public.lesson_media, public.content_assignments from anon, authenticated;

grant select on table public.courses, public.course_levels, public.modules, public.lessons,
  public.lesson_content, public.lesson_media to anon, authenticated;
grant insert, update, delete on table public.courses, public.course_levels, public.modules,
  public.lessons, public.lesson_content, public.lesson_media to authenticated;
grant select on table public.content_assignments to authenticated;
