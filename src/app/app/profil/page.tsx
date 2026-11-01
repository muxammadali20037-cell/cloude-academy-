import type { Metadata } from "next";
import { IntegrationStatusRow } from "@/components/system/integration-status";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/data/learning";
import { getIntegrationStatuses } from "@/lib/integrations";
import { SignOutButton } from "../_components/sign-out-button";
import { NameForm } from "./name-form";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireUser("/app/profil");
  const profile = await getMyProfile(user.id);
  const telegram = getIntegrationStatuses().find((item) => item.id === "telegram");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-fg">Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Shaxsiy maʼlumot</CardTitle>
          <CardDescription>{user.email ?? user.phone ?? "Kirish maʼlumoti yoʻq"}</CardDescription>
        </CardHeader>
        <CardContent>
          <NameForm defaultName={profile?.fullName ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
          <CardDescription>Bot orqali eslatmalar va Mini App — akkauntni bogʻlash keyingi relizda.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {telegram && (
            <IntegrationStatusRow
              name={telegram.name}
              purpose={telegram.purpose}
              configured={telegram.configured}
              phase={telegram.phase}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Koʻrinish</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <SignOutButton withLabel />
    </div>
  );
}
