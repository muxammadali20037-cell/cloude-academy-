/**
 * Sahifa chizilishidan oldin to'g'ri temani qo'yadi (miltillashsiz).
 * Next.js "Preventing flash before hydration" tavsiyasi bo'yicha: <head>
 * ichidagi kichik inline skript localStorage'dagi tanlovni o'qiydi.
 *
 * Saqlanadigan qiymatlar: "light" | "dark" | "system" (standart: "system").
 */
export const THEME_STORAGE_KEY = "theme";

const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
