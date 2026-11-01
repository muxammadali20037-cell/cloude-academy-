-- =====================================================================
-- 5. KURS DASTURI TUZILMASI (faqat nomlar, mazmunsiz)
-- =====================================================================
-- Manba: topshiriqning 7-bo'limi, Phase 1 hujjatining 11-bo'limidagi
-- tuzatishlar bilan (Cowork → "uzoq vazifalar", Claude Max → "Rejalar va
-- limitlar", Claude in Chrome va ekotizim darslari qo'shilgan).
--
-- Darslar 'planned' holatida: dasturda ko'rinadi, lekin ochilmaydi.
-- Mazmun yozilib, admin tasdiqlagach 'published' bo'ladi.
-- Tariflar faol emas va narxsiz: narxni admin belgilaydi.
-- Takroran ishga tushirilsa hech narsa qilmaydi. Hech narsa o'chirmaydi.

do $$
declare
  v_course uuid;
  v_level uuid;
  v_module uuid;
  lvl record;
  mdl record;
  v_curriculum jsonb := $json$
  [
    {"number": 1, "title": "Claude asoslari",
     "description": "Claude nima, qanday ishlaydi va kundalik ishda undan qanday foydalaniladi.",
     "modules": [
       {"title": "Claude bilan tanishuv", "lessons": [
         "Claude nima?", "Anthropic va Claude ekotizimi", "Model tushunchasi",
         "Token va kontekst oynasi", "Claude modellarini tanlash"]},
       {"title": "Ishchi muhit", "lessons": [
         "Chat interfeysi", "Projects", "Fayllar bilan ishlash", "Artifacts",
         "Claude ichidagi imkoniyatlar: hujjatlar, dizayn, ovozli rejim"]},
       {"title": "Kengaytirilgan imkoniyatlar", "lessons": [
         "Research", "Connectors", "Memory", "Multimodal imkoniyatlar",
         "Skills va plugins bilan tanishuv", "Rejalar va limitlar"]}
     ]},
    {"number": 2, "title": "Prompt va kontekst muhandisligi",
     "description": "Claudeʼdan aniq, ishonchli va tekshiriladigan natija olish.",
     "modules": [
       {"title": "Prompt asoslari", "lessons": [
         "Prompt engineering nima?", "Rol berish (role prompting)",
         "Tizim koʻrsatmalari (system prompt)", "Tuzilgan promptlar", "XML teglari",
         "Namunalar bilan oʻrgatish (few-shot)"]},
       {"title": "Fikrlash va zanjirlar", "lessons": [
         "Bosqichma-bosqich fikrlash va xavfsiz reasoning", "Prompt zanjirlari (prompt chaining)",
         "Iterativ prompting", "Promptni optimallashtirish"]},
       {"title": "Kontekst va sifat nazorati", "lessons": [
         "Kontekst muhandisligi", "Uzun kontekst bilan ishlash",
         "Gallyutsinatsiyani aniqlash", "Natijani tekshirish"]}
     ]},
    {"number": 3, "title": "Claude Code va dasturlash",
     "description": "Claude Code bilan ilova yaratish: oʻrnatishdan deploygacha.",
     "modules": [
       {"title": "Ishga tushirish", "lessons": [
         "Claude Codeʼni oʻrnatish", "Terminal asoslari", "IDE integratsiyasi",
         "Git va GitHub", "CLAUDE.md fayli"]},
       {"title": "Agent bilan ishlash", "lessons": [
         "Plan mode", "Agentli dasturlash (agentic coding)",
         "Fayl tizimi bilan ishlash", "Kod bazasini oʻrganish"]},
       {"title": "Ilova qurish", "lessons": [
         "Frontend", "Backend", "API", "Maʼlumotlar bazasi", "Autentifikatsiya"]},
       {"title": "Sifat va chiqarish", "lessons": [
         "Xatolarni tuzatish (debugging)", "Testlash", "Refaktoring", "Deploy", "Xavfsizlik"]}
     ]},
    {"number": 4, "title": "Claudeʼning ilgʻor imkoniyatlari",
     "description": "Skills, agentlar, MCP va kompyuter bilan ishlash.",
     "modules": [
       {"title": "Uzoq vazifalar va skills", "lessons": [
         "Claude bilan uzoq vazifalar va tayyor natija", "Agent Skills",
         "Oʻz skillingizni yaratish", "Plugins"]},
       {"title": "Agentlar", "lessons": [
         "Subagentlar", "Hooks", "Multi-agent orkestratsiya", "Rejali vazifalar"]},
       {"title": "Integratsiyalar", "lessons": [
         "Connectors", "MCP (Model Context Protocol)", "MCP server yaratish", "Tool use"]},
       {"title": "Kompyuter va brauzer", "lessons": [
         "Computer use", "Claude in Chrome", "Brauzer jarayonlarini avtomatlashtirish"]}
     ]},
    {"number": 5, "title": "AI muhandisligi",
     "description": "Claude API bilan production darajasidagi ilovalar qurish.",
     "modules": [
       {"title": "Claude API asoslari", "lessons": [
         "Claude API", "Claude Console", "Messages API", "Streaming"]},
       {"title": "Tuzilgan natijalar va vositalar", "lessons": [
         "Tool calling", "Structured outputs", "Vision", "Prompt caching", "Batch processing"]},
       {"title": "RAG va agentlar", "lessons": [
         "RAG", "Embeddings", "Agent SDK", "Managed Agents va Tool Runner"]},
       {"title": "Productionga chiqarish", "lessons": [
         "Baholash (evaluation)", "Kuzatuv (observability)", "Xarajatni optimallashtirish",
         "Rate limitlar", "Production xavfsizligi"]}
     ]},
    {"number": 6, "title": "Real loyihalar",
     "description": "Portfolio uchun 8 ta toʻliq loyiha.",
     "modules": [
       {"title": "Assistentlar va agentlar", "lessons": [
         "Professional AI assistent", "Biznes tadqiqot agenti",
         "Mijozlarni qoʻllab-quvvatlash agenti", "Telegram AI assistent"]},
       {"title": "Toʻliq tizimlar", "lessons": [
         "AI ish tavsiya tizimi", "Full-stack SaaS platforma",
         "AI avtomatlashtirish tizimi", "Yakuniy capstone loyiha"]}
     ]}
  ]
  $json$::jsonb;
begin
  if exists (select 1 from public.courses where slug = 'claude-masterclass') then
    return;
  end if;

  insert into public.courses (slug, title, subtitle, description, status)
  values (
    'claude-masterclass',
    'Claude Masterclass',
    'Noldan professional darajagacha',
    'Claudeʼni amaliy mashqlar, video darslar va AI mentor bilan oʻrganing: oddiy suhbatdan API va agentlar bilan ishlaydigan ilovalargacha.',
    'published'
  )
  returning id into v_course;

  for lvl in select value from jsonb_array_elements(v_curriculum) loop
    insert into public.course_levels (course_id, number, title, description, status)
    values (
      v_course,
      (lvl.value ->> 'number')::smallint,
      lvl.value ->> 'title',
      lvl.value ->> 'description',
      'published'
    )
    returning id into v_level;

    for mdl in
      select value, ordinality from jsonb_array_elements(lvl.value -> 'modules') with ordinality
    loop
      insert into public.modules (level_id, title, status, sort_order)
      values (v_level, mdl.value ->> 'title', 'published', (mdl.ordinality - 1)::integer)
      returning id into v_module;

      insert into public.lessons (module_id, title, status, sort_order)
      select v_module, t.title, 'planned', (t.ord - 1)::integer
      from jsonb_array_elements_text(mdl.value -> 'lessons') with ordinality as t (title, ord);
    end loop;
  end loop;

  -- Tariflar: faol emas, narxsiz. Narx va muddatni admin belgilaydi.
  insert into public.plans (code, name, description, course_id, features, is_active, sort_order)
  values
    ('masterclass', 'Masterclass', 'Toʻliq kurs va sertifikat', v_course, array[
      'Toʻliq kurs: 6 daraja',
      'Barcha video darslar',
      'Interaktiv mashqlar va avtomatik tekshiruv',
      'AI mentor (belgilangan limit bilan)',
      'Sertifikat'
    ], false, 1),
    ('pro', 'Pro', 'Masterclass va kengaytirilgan amaliyot', v_course, array[
      'Masterclassʼdagi hamma narsa',
      'Ilgʻor loyihalar',
      'Kengaytirilgan AI mentor limiti',
      'Qoʻshimcha amaliy topshiriqlar',
      'Loyihalarni professional baholash'
    ], false, 2);
end;
$$;
