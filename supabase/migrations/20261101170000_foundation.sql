-- =====================================================================
-- 1. POYDEVOR: profillar, xodim rollari, RLS yordamchi funksiyalari
-- =====================================================================
-- Qoidalar:
--   * Har bir jadvalda RLS yoqilgan.
--   * SECURITY DEFINER funksiyalar API'ga ochilmagan `private` sxemasida.
--   * Har bir funksiyada search_path = '' (sxema nomlari to'liq yoziladi).

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- Xodim rollari. Oddiy talaba uchun alohida yozuv yo'q: rol yo'q = talaba.
create type public.app_role as enum ('content_manager', 'admin');

-- ---------------------------------------------------------------------
-- updated_at maydonini avtomatik yangilash
-- ---------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profillar: auth.users bilan 1:1. Email va telefon auth.users'da qoladi
-- (shaxsiy ma'lumot takrorlanmaydi).
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) between 2 and 120),
  timezone text not null default 'Asia/Tashkent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Foydalanuvchi profili. full_name sertifikatda ishlatiladi.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------
-- Xodim rollari
-- ---------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- ---------------------------------------------------------------------
-- Yordamchi funksiyalar (RLS qoidalarida ishlatiladi)
-- ---------------------------------------------------------------------
create function private.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = check_role
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin');
$$;

revoke all on function private.has_role(public.app_role) from public;
revoke all on function private.is_admin() from public;
grant execute on function private.has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Yangi foydalanuvchi ro'yxatdan o'tganda profil yaratiladi
-- ---------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    case when char_length(raw_name) between 2 and 120 then raw_name end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------
create policy "profiles: o'z profilini ko'radi"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "profiles: o'z profilini tahrirlaydi"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Talaba faqat ismini tahrirlaydi (sertifikat uchun). Vaqt mintaqasi
-- noto'g'ri qiymat bilan hisob-kitoblarni buzmasligi uchun yopiq.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- RLS: user_roles (yozish faqat server kaliti orqali, audit bilan — 7-faza)
-- ---------------------------------------------------------------------
create policy "user_roles: o'z rolini yoki admin hammasini ko'radi"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;
