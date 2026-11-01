import { beforeAll, describe, expect, it } from "vitest";
import { asAnon, asUser, createTestDb, createUser, errorOf, type Db } from "./harness";

/**
 * Ruxsat qoidalari (RLS) testlari: har bir rol faqat o'ziga tegishli narsani
 * ko'radi va o'zgartiradi. Baza — haqiqiy PostgreSQL (PGlite) + barcha
 * migratsiyalar, Supabase'ning standart huquqlari bilan.
 */

let db: Db;
const ids = {} as {
  studentA: string;
  studentB: string;
  admin: string;
  cmAssigned: string;
  cmOther: string;
  course: string;
  freeLesson: string;
  paidLesson: string;
  videoLesson: string;
  draftLesson: string;
};

async function one<T>(sql: string, params: unknown[] = []) {
  const r = await db.query<T>(sql, params);
  return r.rows[0];
}

beforeAll(async () => {
  db = await createTestDb();

  ids.studentA = await createUser(db, { email: "a@test.uz", fullName: "Aziza Karimova" });
  ids.studentB = await createUser(db, { email: "b@test.uz" });
  ids.admin = await createUser(db, { email: "admin@test.uz", fullName: "Admin" });
  ids.cmAssigned = await createUser(db, { email: "cm1@test.uz" });
  ids.cmOther = await createUser(db, { email: "cm2@test.uz" });

  ids.course = (await one<{ id: string }>("select id from public.courses where slug = 'claude-masterclass'")).id;

  await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin'), ($2, 'content_manager'), ($3, 'content_manager')", [
    ids.admin,
    ids.cmAssigned,
    ids.cmOther,
  ]);
  await db.query("insert into public.content_assignments (user_id, course_id) values ($1, $2)", [ids.cmAssigned, ids.course]);

  // 1-daraja, 1-modulning dastlabki 4 ta darsini test holatlariga keltiramiz.
  const lessons = await db.query<{ id: string }>(
    `select l.id from public.lessons l
     join public.modules m on m.id = l.module_id
     join public.course_levels cl on cl.id = m.level_id
     where cl.number = 1 and m.sort_order = 0 order by l.sort_order limit 4`,
  );
  [ids.freeLesson, ids.paidLesson, ids.videoLesson, ids.draftLesson] = lessons.rows.map((r) => r.id);

  await db.query("update public.lessons set status = 'published', is_free_preview = true where id = $1", [ids.freeLesson]);
  await db.query("update public.lessons set status = 'published' where id in ($1, $2)", [ids.paidLesson, ids.videoLesson]);
  await db.query("update public.lessons set status = 'draft' where id = $1", [ids.draftLesson]);

  for (const lesson of [ids.freeLesson, ids.paidLesson, ids.videoLesson, ids.draftLesson]) {
    await db.query(
      `insert into public.lesson_content (lesson_id, kind, sort_order, title, body_md) values
       ($1, 'text', 0, 'Kirish', 'Matn'), ($1, 'task', 1, 'Vazifa', 'Vazifa matni'), ($1, 'next', 2, 'Keyingi qadam', null)`,
      [lesson],
    );
  }
  await db.query(
    "insert into public.lesson_media (lesson_id, kind, provider, status) values ($1, 'video', 'bunny', 'ready')",
    [ids.videoLesson],
  );

  await db.query("insert into public.access_grants (user_id, course_id, source) values ($1, $2, 'admin')", [
    ids.studentA,
    ids.course,
  ]);
});

describe("kurs dasturi (seed)", () => {
  it("6 daraja, 90 dars; tariflar faol emas va narxsiz", async () => {
    const levels = await one<{ n: number }>("select count(*)::int as n from public.course_levels");
    const lessons = await one<{ n: number }>("select count(*)::int as n from public.lessons");
    const plans = await db.query<{ is_active: boolean; price_tiyin: string | null }>("select is_active, price_tiyin from public.plans");
    expect(levels.n).toBe(6);
    expect(lessons.n).toBe(90);
    expect(plans.rows).toHaveLength(2);
    expect(plans.rows.every((p) => !p.is_active && p.price_tiyin === null)).toBe(true);
  });

  it("narxsiz tarifni faollashtirib bo'lmaydi", async () => {
    const message = await errorOf(db.query("update public.plans set is_active = true where code = 'masterclass'"));
    expect(message).toContain("plans_active_needs_price");
  });
});

describe("profillar", () => {
  it("ro'yxatdan o'tganda profil yaratiladi, ism metadata'dan olinadi", async () => {
    const profile = await one<{ full_name: string | null }>("select full_name from public.profiles where id = $1", [ids.studentA]);
    expect(profile.full_name).toBe("Aziza Karimova");
  });

  it("juda uzun ism profilni buzmaydi (null bo'ladi)", async () => {
    const id = await createUser(db, { email: "long@test.uz", fullName: "x".repeat(300) });
    const profile = await one<{ full_name: string | null }>("select full_name from public.profiles where id = $1", [id]);
    expect(profile.full_name).toBeNull();
  });

  it("talaba faqat o'z profilini ko'radi", async () => {
    const rows = await asUser(db, ids.studentA, (tx) => tx.query<{ id: string }>("select id from public.profiles"));
    expect(rows.rows.map((r) => r.id)).toEqual([ids.studentA]);
  });

  it("admin hamma profillarni ko'radi", async () => {
    const rows = await asUser(db, ids.admin, (tx) => tx.query("select id from public.profiles"));
    expect(rows.rows.length).toBeGreaterThanOrEqual(5);
  });

  it("talaba o'z ismini o'zgartira oladi, boshqanikini emas", async () => {
    const own = await asUser(db, ids.studentA, (tx) =>
      tx.query("update public.profiles set full_name = 'Aziza K.' where id = $1", [ids.studentA]),
    );
    expect(own.affectedRows).toBe(1);
    const other = await asUser(db, ids.studentA, (tx) =>
      tx.query("update public.profiles set full_name = 'Buzildi' where id = $1", [ids.studentB]),
    );
    expect(other.affectedRows).toBe(0);
  });

  it("vaqt mintaqasi va boshqa ustunlar talabaga yopiq", async () => {
    const message = await errorOf(
      asUser(db, ids.studentA, (tx) => tx.query("update public.profiles set timezone = 'X' where id = $1", [ids.studentA])),
    );
    expect(message).toContain("permission denied");
  });

  it("kirmagan foydalanuvchi profillarni umuman ko'ra olmaydi", async () => {
    const message = await errorOf(asAnon(db, (tx) => tx.query("select * from public.profiles")));
    expect(message).toContain("permission denied");
  });
});

describe("rollar", () => {
  it("talaba o'ziga admin rolini bera olmaydi", async () => {
    const message = await errorOf(
      asUser(db, ids.studentA, (tx) => tx.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [ids.studentA])),
    );
    expect(message).toContain("permission denied");
  });
});

describe("kurs tuzilmasi va dars mazmuni", () => {
  it("kirmagan foydalanuvchi dasturni (nomlarni) ko'radi, qoralamani ko'rmaydi", async () => {
    const r = await asAnon(db, (tx) => tx.query<{ id: string }>("select id from public.lessons"));
    const visible = r.rows.map((row) => row.id);
    expect(visible).toHaveLength(89);
    expect(visible).not.toContain(ids.draftLesson);
  });

  it("bepul dars mazmuni hammaga ochiq", async () => {
    const r = await asAnon(db, (tx) => tx.query("select id from public.lesson_content where lesson_id = $1", [ids.freeLesson]));
    expect(r.rows).toHaveLength(3);
  });

  it("pullik dars mazmuni kirish huquqisiz yopiq", async () => {
    const anon = await asAnon(db, (tx) => tx.query("select id from public.lesson_content where lesson_id = $1", [ids.paidLesson]));
    const noAccess = await asUser(db, ids.studentB, (tx) =>
      tx.query("select id from public.lesson_content where lesson_id = $1", [ids.paidLesson]),
    );
    const withAccess = await asUser(db, ids.studentA, (tx) =>
      tx.query("select id from public.lesson_content where lesson_id = $1", [ids.paidLesson]),
    );
    expect(anon.rows).toHaveLength(0);
    expect(noAccess.rows).toHaveLength(0);
    expect(withAccess.rows).toHaveLength(3);
  });

  it("bekor qilingan yoki muddati o'tgan kirish huquqi ishlamaydi", async () => {
    const userId = await createUser(db, { email: "expired@test.uz" });
    await db.query(
      `insert into public.access_grants (user_id, course_id, source, starts_at, ends_at)
       values ($1, $2, 'admin', now() - interval '30 days', now() - interval '1 day')`,
      [userId, ids.course],
    );
    const expired = await asUser(db, userId, (tx) => tx.query("select id from public.lesson_content where lesson_id = $1", [ids.paidLesson]));
    expect(expired.rows).toHaveLength(0);

    await db.query(
      "insert into public.access_grants (user_id, course_id, source, revoked_at) values ($1, $2, 'admin', now())",
      [userId, ids.course],
    );
    const revoked = await asUser(db, userId, (tx) => tx.query("select id from public.lesson_content where lesson_id = $1", [ids.paidLesson]));
    expect(revoked.rows).toHaveLength(0);
  });

  it("rejalashtirilgan dars mazmuni hech kimga ochilmaydi (muharrirdan tashqari)", async () => {
    const planned = await one<{ id: string }>("select id from public.lessons where status = 'planned' limit 1");
    await db.query("insert into public.lesson_content (lesson_id, kind, sort_order, title) values ($1, 'text', 0, 'Qoralama')", [planned.id]);
    const student = await asUser(db, ids.studentA, (tx) => tx.query("select id from public.lesson_content where lesson_id = $1", [planned.id]));
    const editor = await asUser(db, ids.cmAssigned, (tx) => tx.query("select id from public.lesson_content where lesson_id = $1", [planned.id]));
    expect(student.rows).toHaveLength(0);
    expect(editor.rows).toHaveLength(1);
  });

  it("qoralama darsni faqat admin va biriktirilgan muharrir ko'radi", async () => {
    const count = async (userId: string) =>
      (await asUser(db, userId, (tx) => tx.query("select id from public.lessons where id = $1", [ids.draftLesson]))).rows.length;
    expect(await count(ids.studentA)).toBe(0);
    expect(await count(ids.cmOther)).toBe(0);
    expect(await count(ids.cmAssigned)).toBe(1);
    expect(await count(ids.admin)).toBe(1);
  });

  it("kontentni faqat biriktirilgan muharrir o'zgartiradi", async () => {
    const update = (userId: string) =>
      asUser(db, userId, (tx) => tx.query("update public.lessons set summary = 'yangi' where id = $1", [ids.draftLesson]));
    expect((await update(ids.studentA)).affectedRows).toBe(0);
    expect((await update(ids.cmOther)).affectedRows).toBe(0);
    expect((await update(ids.cmAssigned)).affectedRows).toBe(1);
  });

  it("kirmagan foydalanuvchi kontent yoza olmaydi (standart huquqlar yopilgan)", async () => {
    const message = await errorOf(
      asAnon(db, (tx) => tx.query("update public.lessons set title = 'buzildi'")),
    );
    expect(message).toContain("permission denied");
  });

  it("talaba yangi dars qo'sha olmaydi", async () => {
    const target = await one<{ id: string }>("select id from public.modules limit 1");
    const message = await errorOf(
      asUser(db, ids.studentA, (tx) => tx.query("insert into public.lessons (module_id, title) values ($1, 'Soxta dars')", [target.id])),
    );
    expect(message).toContain("row-level security");
  });

  it("tayyor bo'lmagan media talabaga ko'rinmaydi, muharrirga ko'rinadi", async () => {
    await db.query("insert into public.lesson_media (lesson_id, kind, provider, status) values ($1, 'audio', 'azure', 'processing')", [ids.paidLesson]);
    const student = await asUser(db, ids.studentA, (tx) => tx.query("select id from public.lesson_media where lesson_id = $1", [ids.paidLesson]));
    const editor = await asUser(db, ids.cmAssigned, (tx) => tx.query("select id from public.lesson_media where lesson_id = $1", [ids.paidLesson]));
    expect(student.rows).toHaveLength(0);
    expect(editor.rows).toHaveLength(1);
  });

  it("dars bo'limini faqat biriktirilgan muharrir qo'shadi", async () => {
    const insert = (userId: string) =>
      asUser(db, userId, (tx) =>
        tx.query("insert into public.lesson_content (lesson_id, kind, sort_order, title) values ($1, 'quiz', 9, 'Test')", [
          ids.draftLesson,
        ]),
      );
    expect(await errorOf(insert(ids.cmOther))).toContain("row-level security");
    expect((await insert(ids.cmAssigned)).affectedRows).toBe(1);
  });

  it("muharrir yangi tarif yarata olmaydi, admin yaratadi", async () => {
    const insert = (userId: string) =>
      asUser(db, userId, (tx) => tx.query("insert into public.plans (code, name) values ('test-plan', 'Test')"));
    expect(await errorOf(insert(ids.cmAssigned))).toContain("row-level security");
    expect((await insert(ids.admin)).affectedRows).toBe(1);
  });
});

describe("tariflar va kirish huquqi", () => {
  it("faol bo'lmagan tariflar ochiq ko'rinmaydi, admin ko'radi", async () => {
    const anon = await asAnon(db, (tx) => tx.query("select id from public.plans"));
    const admin = await asUser(db, ids.admin, (tx) => tx.query("select id from public.plans"));
    expect(anon.rows).toHaveLength(0);
    expect(admin.rows).toHaveLength(2);
  });

  it("talaba o'ziga kirish huquqi bera olmaydi", async () => {
    const message = await errorOf(
      asUser(db, ids.studentB, (tx) =>
        tx.query("insert into public.access_grants (user_id, course_id, source) values ($1, $2, 'admin')", [ids.studentB, ids.course]),
      ),
    );
    expect(message).toContain("permission denied");
  });

  it("talaba faqat o'z kirish huquqini ko'radi", async () => {
    const r = await asUser(db, ids.studentB, (tx) => tx.query("select id from public.access_grants"));
    expect(r.rows).toHaveLength(0);
  });

  it("to'lov orqali kirish buyurtmasiz yaratilmaydi", async () => {
    const message = await errorOf(
      db.query("insert into public.access_grants (user_id, course_id, source) values ($1, $2, 'payment')", [ids.studentB, ids.course]),
    );
    expect(message).toContain("access_grants_payment_has_order");
  });
});

describe("dars progressi", () => {
  it("progressni to'g'ridan-to'g'ri yozib bo'lmaydi", async () => {
    const message = await errorOf(
      asUser(db, ids.studentA, (tx) =>
        tx.query("insert into public.lesson_progress (user_id, lesson_id, status, completed_at) values ($1, $2, 'completed', now())", [
          ids.studentA,
          ids.paidLesson,
        ]),
      ),
    );
    expect(message).toContain("permission denied");
  });

  it("kirmagan foydalanuvchi progress funksiyalarini chaqira olmaydi", async () => {
    const message = await errorOf(asAnon(db, (tx) => tx.query("select public.start_lesson($1)", [ids.freeLesson])));
    expect(message).toContain("permission denied");
  });

  it("kirish huquqisiz pullik darsni boshlab bo'lmaydi", async () => {
    const message = await errorOf(asUser(db, ids.studentB, (tx) => tx.query("select public.start_lesson($1)", [ids.paidLesson])));
    expect(message).toContain("no_access");
  });

  it("bosqichlarni o'tkazib yuborib bo'lmaydi, tugatish shartlari tekshiriladi", async () => {
    await asUser(
      db,
      ids.studentA,
      async (tx) => {
        await tx.query("select public.start_lesson($1)", [ids.paidLesson]);

        expect(await errorOf(tx.query("select public.complete_lesson($1)", [ids.paidLesson]))).toContain("steps_incomplete");
      },
      { commit: false },
    );

    await asUser(
      db,
      ids.studentA,
      async (tx) => {
        await tx.query("select public.start_lesson($1)", [ids.paidLesson]);
        await tx.query("savepoint s");
        expect(await errorOf(tx.query("select public.advance_lesson_step($1, 2::smallint)", [ids.paidLesson]))).toContain(
          "step_not_allowed",
        );
        await tx.query("rollback to savepoint s");
        expect(await errorOf(tx.query("select public.advance_lesson_step($1, 9::smallint)", [ids.paidLesson]))).toContain(
          "invalid_step",
        );
        await tx.query("rollback to savepoint s");
        await tx.query("select public.advance_lesson_step($1, 1::smallint)", [ids.paidLesson]);
        await tx.query("select public.advance_lesson_step($1, 2::smallint)", [ids.paidLesson]);
        await tx.query("select public.advance_lesson_step($1, 0::smallint)", [ids.paidLesson]);
        const done = await tx.query<{ status: string; max_step_reached: number }>(
          "select (public.complete_lesson($1)).*",
          [ids.paidLesson],
        );
        expect(done.rows[0].status).toBe("completed");
        expect(done.rows[0].max_step_reached).toBe(2);
      },
      { commit: true },
    );
  });

  it("tayyor video bo'lsa, admin belgilagan foizgacha ko'rilishi shart", async () => {
    await asUser(
      db,
      ids.studentA,
      async (tx) => {
        await tx.query("select public.start_lesson($1)", [ids.videoLesson]);
        await tx.query("select public.advance_lesson_step($1, 1::smallint)", [ids.videoLesson]);
        await tx.query("select public.advance_lesson_step($1, 2::smallint)", [ids.videoLesson]);
        await tx.query("savepoint s");
        expect(await errorOf(tx.query("select public.complete_lesson($1)", [ids.videoLesson]))).toContain("video_incomplete");
        await tx.query("rollback to savepoint s");
        await tx.query("select public.record_video_progress($1, 300, 85::smallint)", [ids.videoLesson]);
        // Foiz kamaymaydi
        await tx.query("select public.record_video_progress($1, 10, 5::smallint)", [ids.videoLesson]);
        const done = await tx.query<{ status: string; video_percent: number }>("select (public.complete_lesson($1)).*", [
          ids.videoLesson,
        ]);
        expect(done.rows[0].status).toBe("completed");
        expect(done.rows[0].video_percent).toBe(85);
      },
    );
  });

  it("talaba boshqa talabaning progressini ko'rmaydi", async () => {
    const r = await asUser(db, ids.studentB, (tx) => tx.query("select * from public.lesson_progress"));
    expect(r.rows).toHaveLength(0);
  });
});

describe("dashboard ma'lumoti (my_course_overview)", () => {
  type Overview = {
    has_access: boolean;
    total_lessons: number;
    published_lessons: number;
    completed_lessons: number;
    completed_modules: number;
    streak_days: number;
    learning_minutes: number;
    next_lesson: { id: string; title: string } | null;
  };

  const overview = (userId: string) =>
    asUser(db, userId, async (tx) => {
      const r = await tx.query<{ o: Overview }>("select public.my_course_overview('claude-masterclass') as o");
      return r.rows[0].o;
    });

  it("yangi talabada hammasi 0, faqat bepul dars taklif qilinadi", async () => {
    const o = await overview(ids.studentB);
    expect(o.has_access).toBe(false);
    expect(o.completed_lessons).toBe(0);
    expect(o.completed_modules).toBe(0);
    expect(o.streak_days).toBe(0);
    expect(o.learning_minutes).toBe(0);
    expect(o.total_lessons).toBe(89);
    expect(o.next_lesson?.id).toBe(ids.freeLesson);
  });

  it("tugatilgan dars va o'qish vaqti hisoblanadi, ketma-ket kunlar sanaladi", async () => {
    await asUser(
      db,
      ids.studentA,
      (tx) => tx.query("select public.record_learning_time($1, 90)", [ids.paidLesson]),
      { commit: true },
    );
    // Kechagi va o'tgan kunlar (to'g'ridan-to'g'ri, test uchun)
    await db.query(
      `insert into public.learning_sessions (user_id, local_day, seconds) values
       ($1, (now() at time zone 'Asia/Tashkent')::date - 1, 120),
       ($1, (now() at time zone 'Asia/Tashkent')::date - 3, 60)`,
      [ids.studentA],
    );
    const o = await overview(ids.studentA);
    expect(o.has_access).toBe(true);
    expect(o.completed_lessons).toBe(1);
    expect(o.streak_days).toBe(2);
    expect(o.learning_minutes).toBe(4);
    // Joriy dars: boshlangan, lekin tugatilmagan dars yoki keyingi ochiq dars
    expect(o.next_lesson).not.toBeNull();
  });

  it("o'qish vaqti tez-tez yuborilsa ikki marta hisoblanmaydi", async () => {
    const userId = await createUser(db, { email: "spam@test.uz" });
    await asUser(
      db,
      userId,
      async (tx) => {
        await tx.query("select public.record_learning_time(null, 60)");
        await tx.query("select public.record_learning_time(null, 60)");
        await tx.query("select public.record_learning_time(null, 9999)");
      },
      { commit: true },
    );
    const total = await one<{ s: number }>("select coalesce(sum(seconds), 0)::int as s from public.learning_sessions where user_id = $1", [userId]);
    expect(total.s).toBe(60);
  });
});
