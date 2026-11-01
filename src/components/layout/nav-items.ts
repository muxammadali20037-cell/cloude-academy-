import { Award, BookOpen, House, MessagesSquare, Trophy, User, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Mobil pastki menyuda ko'rsatiladimi (5 tadan oshmasligi kerak). */
  mobile: boolean;
  /**
   * Sahifa ishga tushganmi. Tayyor bo'lmagan bo'lim menyuda ko'rsatilmaydi —
   * ishlamaydigan tugma bo'lmasligi uchun.
   */
  available: boolean;
};

/** Talaba kabineti navigatsiyasi. Manzillar Phase 1 hujjatidagi sahifalar ro'yxatiga mos. */
export const STUDENT_NAV_ALL: NavItem[] = [
  { href: "/app", label: "Bosh sahifa", icon: House, mobile: true, available: true },
  { href: "/app/kurs", label: "Kurs", icon: BookOpen, mobile: true, available: true },
  { href: "/app/mentor", label: "Mentor", icon: MessagesSquare, mobile: true, available: false },
  { href: "/app/yutuqlar", label: "Yutuqlar", icon: Trophy, mobile: true, available: false },
  { href: "/app/sertifikatlar", label: "Sertifikatlar", icon: Award, mobile: false, available: false },
  { href: "/app/profil", label: "Profil", icon: User, mobile: true, available: true },
];

export const STUDENT_NAV: NavItem[] = STUDENT_NAV_ALL.filter((item) => item.available);

/** Joriy manzilga eng uzun mos keladigan menyu bandi faol hisoblanadi. */
export function isActive(itemHref: string, currentPath: string) {
  if (itemHref === "/app") return currentPath === "/app";
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
}
