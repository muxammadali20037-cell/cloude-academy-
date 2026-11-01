import { Award, BookOpen, House, MessagesSquare, Trophy, User, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Mobil pastki menyuda ko'rsatiladimi (5 tadan oshmasligi kerak). */
  mobile: boolean;
};

/** Talaba kabineti navigatsiyasi. Manzillar 4-bo'limdagi sahifalar ro'yxatiga mos. */
export const STUDENT_NAV: NavItem[] = [
  { href: "/app", label: "Bosh sahifa", icon: House, mobile: true },
  { href: "/app/kurs", label: "Kurs", icon: BookOpen, mobile: true },
  { href: "/app/mentor", label: "Mentor", icon: MessagesSquare, mobile: true },
  { href: "/app/yutuqlar", label: "Yutuqlar", icon: Trophy, mobile: true },
  { href: "/app/sertifikatlar", label: "Sertifikatlar", icon: Award, mobile: false },
  { href: "/app/profil", label: "Profil", icon: User, mobile: true },
];

/** Joriy manzilga eng uzun mos keladigan menyu bandi faol hisoblanadi. */
export function isActive(itemHref: string, currentPath: string) {
  if (itemHref === "/app") return currentPath === "/app";
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
}
