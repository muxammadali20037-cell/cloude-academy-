import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyCodeForm } from "./verify-code-form";

export const metadata: Metadata = { title: "Kodni kiriting" };

/** Email manzilni qisman yashiradi: dilnoza@gmail.com → di•••••@gmail.com */
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

export default async function VerifyPage() {
  const email = (await cookies()).get("otp_email")?.value;
  if (!email) redirect("/kirish");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Kodni kiriting</h1>
        <p className="text-fg-muted">
          <span className="font-medium text-fg">{maskEmail(email)}</span> manziliga 6 xonali kod
          yubordik. Xat kelmasa, “Spam” papkasini tekshiring.
        </p>
      </div>
      <VerifyCodeForm />
      <p className="text-sm text-fg-subtle">
        Email notoʻgʻrimi?{" "}
        <Link href="/kirish" className="font-medium text-accent-fg underline-offset-4 hover:underline">
          Boshqa manzil kiritish
        </Link>
      </p>
    </div>
  );
}
