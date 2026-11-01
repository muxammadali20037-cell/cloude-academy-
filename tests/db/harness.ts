import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const ROOT = process.cwd();
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");
const SHIM = resolve(ROOT, "tests/db/supabase-shim.sql");

export type Db = PGlite;
export type Tx = Transaction;

/** Yangi bo'sh baza: Supabase shim + barcha migratsiyalar tartib bilan. */
export async function createTestDb(): Promise<Db> {
  const db = new PGlite();
  await db.exec(readFileSync(SHIM, "utf8"));
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    } catch (error) {
      throw new Error(`Migratsiya xatosi: ${file}\n${(error as Error).message}`);
    }
  }
  return db;
}

/** auth.users'ga foydalanuvchi qo'shadi (trigger profil yaratadi). */
export async function createUser(db: Db, opts: { email: string; fullName?: string }) {
  const result = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [opts.email, JSON.stringify(opts.fullName ? { full_name: opts.fullName } : {})],
  );
  return result.rows[0].id;
}

type Role = "anon" | "authenticated" | "service_role";

/**
 * So'rovni berilgan rol va foydalanuvchi nomidan bajaradi — xuddi Supabase
 * API orqali kelgandek. Tranzaksiya oxirida hammasi bekor qilinadi
 * (`commit: true` bo'lsa saqlanadi).
 */
export async function as<T>(
  db: Db,
  who: { role: Role; userId?: string },
  fn: (tx: Tx) => Promise<T>,
  opts: { commit?: boolean } = {},
): Promise<T> {
  let result: T;
  try {
    await db.transaction(async (tx) => {
      // Haqiqiy Supabase'dagi kabi: anon tokenida `sub` yo'q.
      const claims = JSON.stringify(who.userId ? { sub: who.userId, role: who.role } : { role: who.role });
      await tx.query("select set_config('request.jwt.claims', $1, true)", [claims]);
      await tx.exec(`set local role ${who.role}`);
      result = await fn(tx);
      if (!opts.commit) throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  return result!;
}

class Rollback extends Error {}

export const asAnon = <T>(db: Db, fn: (tx: Tx) => Promise<T>) => as(db, { role: "anon" }, fn);
export const asUser = <T>(db: Db, userId: string, fn: (tx: Tx) => Promise<T>, opts?: { commit?: boolean }) =>
  as(db, { role: "authenticated", userId }, fn, opts);

/** Kutilgan xato bilan tugashini tekshirish uchun: xato matnini qaytaradi. */
export async function errorOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return (error as Error).message;
  }
  return "";
}
