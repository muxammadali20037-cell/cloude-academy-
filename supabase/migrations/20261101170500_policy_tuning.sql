-- =====================================================================
-- 6. QOIDALARNI SOZLASH (Supabase unumdorlik tekshiruvi natijasida)
-- =====================================================================
-- 1) "for all" muharrir qoidalari o'qish qoidasi bilan ustma-ust tushardi
--    (har bir SELECT ikkala qoidani tekshirardi). Endi muharrir qoidalari
--    faqat yozish uchun; o'qish qoidasi muharrirni allaqachon o'z ichiga oladi.
-- 2) Bog'lanishlar (foreign key) uchun indekslar.
--
-- Ataylab qoldirilgan ogohlantirish: public.start_lesson va boshqa progress
-- funksiyalari SECURITY DEFINER va kirgan foydalanuvchiga ochiq. Bu kerak:
-- talaba progressni faqat shu funksiyalar orqali yozadi, ular ichida
-- foydalanuvchi va kirish huquqi tekshiriladi (tests/db/rls.test.ts).

-- course_levels
drop policy "course_levels: muharrir yozadi" on public.course_levels;
create policy "course_levels: muharrir qo'shadi" on public.course_levels for insert to authenticated
  with check ((select private.can_edit_course(course_id)));
create policy "course_levels: muharrir tahrirlaydi" on public.course_levels for update to authenticated
  using ((select private.can_edit_course(course_id)))
  with check ((select private.can_edit_course(course_id)));
create policy "course_levels: muharrir o'chiradi" on public.course_levels for delete to authenticated
  using ((select private.can_edit_course(course_id)));

-- modules
drop policy "modules: muharrir yozadi" on public.modules;
create policy "modules: muharrir qo'shadi" on public.modules for insert to authenticated
  with check ((select private.can_edit_course(private.level_course_id(level_id))));
create policy "modules: muharrir tahrirlaydi" on public.modules for update to authenticated
  using ((select private.can_edit_course(private.level_course_id(level_id))))
  with check ((select private.can_edit_course(private.level_course_id(level_id))));
create policy "modules: muharrir o'chiradi" on public.modules for delete to authenticated
  using ((select private.can_edit_course(private.level_course_id(level_id))));

-- lessons
drop policy "lessons: muharrir yozadi" on public.lessons;
create policy "lessons: muharrir qo'shadi" on public.lessons for insert to authenticated
  with check ((select private.can_edit_course(private.module_course_id(module_id))));
create policy "lessons: muharrir tahrirlaydi" on public.lessons for update to authenticated
  using ((select private.can_edit_course(private.module_course_id(module_id))))
  with check ((select private.can_edit_course(private.module_course_id(module_id))));
create policy "lessons: muharrir o'chiradi" on public.lessons for delete to authenticated
  using ((select private.can_edit_course(private.module_course_id(module_id))));

-- lesson_content
drop policy "lesson_content: muharrir yozadi" on public.lesson_content;
create policy "lesson_content: muharrir qo'shadi" on public.lesson_content for insert to authenticated
  with check ((select private.can_edit_course(private.lesson_course_id(lesson_id))));
create policy "lesson_content: muharrir tahrirlaydi" on public.lesson_content for update to authenticated
  using ((select private.can_edit_course(private.lesson_course_id(lesson_id))))
  with check ((select private.can_edit_course(private.lesson_course_id(lesson_id))));
create policy "lesson_content: muharrir o'chiradi" on public.lesson_content for delete to authenticated
  using ((select private.can_edit_course(private.lesson_course_id(lesson_id))));

-- lesson_media: o'qish qoidasi faqat tayyor mediani ko'rsatadi; muharrir
-- tayyorlanayotgan mediani ham ko'rishi kerak — shuning uchun qoida qayta yoziladi.
drop policy "lesson_media: muharrir yozadi" on public.lesson_media;
drop policy "lesson_media: ruxsat bor bo'lsa o'qiladi" on public.lesson_media;
create policy "lesson_media: ruxsat bor bo'lsa o'qiladi" on public.lesson_media for select to anon, authenticated
  using (
    (status = 'ready' and private.can_view_lesson_content(lesson_id))
    or (select private.can_edit_course(private.lesson_course_id(lesson_id)))
  );
create policy "lesson_media: muharrir qo'shadi" on public.lesson_media for insert to authenticated
  with check ((select private.can_edit_course(private.lesson_course_id(lesson_id))));
create policy "lesson_media: muharrir tahrirlaydi" on public.lesson_media for update to authenticated
  using ((select private.can_edit_course(private.lesson_course_id(lesson_id))))
  with check ((select private.can_edit_course(private.lesson_course_id(lesson_id))));
create policy "lesson_media: muharrir o'chiradi" on public.lesson_media for delete to authenticated
  using ((select private.can_edit_course(private.lesson_course_id(lesson_id))));

-- plans
drop policy "plans: admin yozadi" on public.plans;
create policy "plans: admin qo'shadi" on public.plans for insert to authenticated
  with check ((select private.is_admin()));
create policy "plans: admin tahrirlaydi" on public.plans for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "plans: admin o'chiradi" on public.plans for delete to authenticated
  using ((select private.is_admin()));

-- Bog'lanishlar uchun indekslar
create index access_grants_course_idx on public.access_grants (course_id);
create index access_grants_granted_by_idx on public.access_grants (granted_by);
create index access_grants_plan_idx on public.access_grants (plan_id);
create index content_assignments_assigned_by_idx on public.content_assignments (assigned_by);
create index learning_sessions_lesson_idx on public.learning_sessions (lesson_id);
create index lessons_created_by_idx on public.lessons (created_by);
create index plans_course_idx on public.plans (course_id);
create index student_enrollments_course_idx on public.student_enrollments (course_id);
create index user_roles_granted_by_idx on public.user_roles (granted_by);
