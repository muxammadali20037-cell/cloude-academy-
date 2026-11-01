-- FAQAT TEST UCHUN (CI'dagi mahalliy Supabase). Haqiqiy bazaga qo'llanmaydi.
-- 1-daraja, 1-modulning 1-darsi: bepul, 3 bosqichli. 2-darsi: pullik, nashr qilingan.

with first_module as (
  select m.id
  from public.modules m
  join public.course_levels cl on cl.id = m.level_id
  where cl.number = 1 and m.sort_order = 0
),
targets as (
  select l.id, l.sort_order
  from public.lessons l
  where l.module_id = (select id from first_module) and l.sort_order in (0, 1)
)
update public.lessons l
set status = 'published',
    is_free_preview = (t.sort_order = 0),
    estimated_minutes = 10,
    summary = 'E2E test darsi'
from targets t
where l.id = t.id;

insert into public.lesson_content (lesson_id, kind, sort_order, title, body_md)
select l.id, s.kind::public.lesson_step_kind, s.ord, s.title, s.body
from public.lessons l
join public.modules m on m.id = l.module_id
join public.course_levels cl on cl.id = m.level_id
cross join (values
  ('text', 0, 'Kirish', 'Bu **test** bosqichi.'),
  ('task', 1, 'Amaliy vazifa', 'Claudeʼga savol yozing.'),
  ('next', 2, 'Keyingi qadam', 'Darsni tugating.')
) as s (kind, ord, title, body)
where cl.number = 1 and m.sort_order = 0 and l.sort_order in (0, 1);
