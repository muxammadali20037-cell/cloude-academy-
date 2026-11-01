import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

const PROTECTED_PREFIX = "/app";

/**
 * Har bir so'rovda: sessiya tokenini yangilaydi va kirmagan foydalanuvchini
 * himoyalangan sahifalardan kirish sahifasiga yo'naltiradi.
 * Bu tezkor tekshiruv; asosiy tekshiruv har bir sahifada serverda (lib/auth.ts).
 */
export async function updateSession(request: NextRequest) {
  const isProtected =
    request.nextUrl.pathname === PROTECTED_PREFIX ||
    request.nextUrl.pathname.startsWith(`${PROTECTED_PREFIX}/`);

  const config = getSupabaseConfig();
  if (!config) {
    return isProtected ? redirectToLogin(request) : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  } catch {
    signedIn = false;
  }

  if (isProtected && !signedIn) {
    return redirectToLogin(request);
  }
  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/kirish";
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}
