-- =====================================================================
-- 3. TARIFLAR VA KIRISH HUQUQI
-- =====================================================================
-- Narxlar kodda emas, shu jadvalda (admin boshqaradi).
-- Kirish huquqi faqat server tomonidan beriladi: tasdiqlangan to'lov
-- webhook'i (9-faza) yoki admin (7-faza, audit bilan).

create type public.access_source as enum ('payment', 'admin', 'promo');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  description text,
  course_id uuid references public.courses (id) on delete restrict,
  -- Narx tiyinda (1 so'm = 100 tiyin). null — narx hali belgilanmagan, sotilmaydi.
  price_tiyin bigint check (price_tiyin is null or price_tiyin >= 0),
  currency text not null default 'UZS' check (currency in ('UZS')),
  -- Kirish muddati kunlarda. null — muddatsiz.
  duration_days integer check (duration_days is null or duration_days > 0),
  -- Oylik AI mentor krediti (tiyinda) — 5-faza.
  ai_monthly_credit_tiyin bigint not null default 0 check (ai_monthly_credit_tiyin >= 0),
  features text[] not null default '{}',
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Faol tarifning narxi bo'lishi shart.
  constraint plans_active_needs_price check (not is_active or price_tiyin is not null)
);

create trigger plans_set_updated_at before update on public.plans
  for each row execute function private.set_updated_at();

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  plan_id uuid references public.plans (id) on delete restrict,
  source public.access_source not null,
  -- To'lov buyurtmasi (9-faza). Bitta buyurtma — bitta kirish huquqi.
  order_id uuid unique,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint access_grants_period check (ends_at is null or ends_at > starts_at),
  constraint access_grants_payment_has_order check (source <> 'payment' or order_id is not null)
);
create index access_grants_user_course_idx on public.access_grants (user_id, course_id);

-- Talaba kursni boshlagani (boshlanish nuqtasi diagnostikadan — 2-reliz).
create table public.student_enrollments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  start_level_number smallint check (start_level_number is null or start_level_number between 0 and 9),
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- ---------------------------------------------------------------------
-- Kirish huquqi tekshiruvi
-- ---------------------------------------------------------------------
create function private.has_course_access(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.access_grants g
    where g.user_id = (select auth.uid())
      and g.course_id = p_course_id
      and g.revoked_at is null
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
  );
$$;

-- Darsning mazmunini ko'rish mumkinmi: nashr qilingan va (bepul yoki kirish bor),
-- yoki foydalanuvchi shu kurs muharriri.
create function private.can_view_lesson_content(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.course_levels cl on cl.id = m.level_id
    join public.courses c on c.id = cl.course_id
    where l.id = p_lesson_id
      and (
        private.can_edit_course(c.id)
        or (
          l.status = 'published'
          and m.status = 'published'
          and cl.status = 'published'
          and c.status = 'published'
          and (l.is_free_preview or private.has_course_access(c.id))
        )
      )
  );
$$;

revoke all on function private.has_course_access(uuid) from public;
revoke all on function private.can_view_lesson_content(uuid) from public;
grant execute on function private.has_course_access(uuid) to anon, authenticated, service_role;
grant execute on function private.can_view_lesson_content(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.access_grants enable row level security;
alter table public.student_enrollments enable row level security;

create policy "plans: faol tariflar ochiq, admin hammasini ko'radi"
  on public.plans for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy "plans: admin yozadi"
  on public.plans for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "access_grants: o'zinikini yoki admin"
  on public.access_grants for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "student_enrollments: o'zinikini yoki admin"
  on public.student_enrollments for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Dars mazmuni va media o'qish qoidalari
create policy "lesson_content: ruxsat bor bo'lsa o'qiladi"
  on public.lesson_content for select to anon, authenticated
  using (private.can_view_lesson_content(lesson_id));

create policy "lesson_media: ruxsat bor bo'lsa o'qiladi"
  on public.lesson_media for select to anon, authenticated
  using (private.can_view_lesson_content(lesson_id) and status = 'ready');

revoke all on table public.plans, public.access_grants, public.student_enrollments from anon, authenticated;
grant select on table public.plans to anon, authenticated;
grant insert, update, delete on table public.plans to authenticated;
-- Kirish huquqi va yozilish: mijoz faqat o'qiydi. Yozish — server funksiyalari orqali.
grant select on table public.access_grants, public.student_enrollments to authenticated;
