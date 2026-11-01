import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({ withLabel = false }: { withLabel?: boolean }) {
  return (
    <form action={signOut}>
      {withLabel ? (
        <Button type="submit" variant="outline">
          <LogOut aria-hidden />
          Chiqish
        </Button>
      ) : (
        <Button type="submit" variant="ghost" size="icon" aria-label="Chiqish" title="Chiqish">
          <LogOut aria-hidden />
        </Button>
      )}
    </form>
  );
}
