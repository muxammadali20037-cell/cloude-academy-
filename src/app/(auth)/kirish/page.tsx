import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IntegrationBadge } from "@/components/system/integration-status";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { EmailLoginForm } from "./email-login-form";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: PageProps<"/kirish">) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);

  if (await getCurrentUser()) redirect(next);
  const configured = getSupabaseConfig() !== null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Kirish</h1>
        <p className="text-fg-muted">
          Email manzilingizni yozing — 6 xonali kod yuboramiz. Akkauntingiz boʻlmasa, shu bilan
          roʻyxatdan oʻtasiz.
        </p>
      </div>

      {!configured && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-card bg-warning-soft p-4 text-sm">
          <p className="text-fg">Kirish tizimi hali ulanmagan. Administrator Supabase sozlamalarini kiritishi kerak.</p>
          <IntegrationBadge configured={false} />
        </div>
      )}

      <EmailLoginForm next={next} disabled={!configured} />

      <p className="text-sm text-fg-subtle">
        Telefon raqam orqali kirish SMS xizmati ulangach qoʻshiladi.
      </p>
    </div>
  );
}
