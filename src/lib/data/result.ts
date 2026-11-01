/**
 * Ma'lumot olish natijasi. Sahifa har bir holatni halol ko'rsatadi:
 * ulanmagan servis uchun soxta ma'lumot o'rniga "NOT CONFIGURED".
 */
export type DataResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_configured" }
  | { status: "unavailable" }
  | { status: "not_found" };

export const notConfigured = { status: "not_configured" } as const;
export const unavailable = { status: "unavailable" } as const;
export const notFound = { status: "not_found" } as const;

export function ok<T>(data: T): DataResult<T> {
  return { status: "ok", data };
}
