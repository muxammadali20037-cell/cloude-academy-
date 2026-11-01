"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileFormState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

const nameSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, " ").trim())
  .pipe(z.string().min(2).max(120));

export async function updateFullName(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = nameSchema.safeParse(formData.get("fullName") ?? "");
  if (!parsed.success) {
    return { status: "error", message: "Ism 2 tadan 120 tagacha belgidan iborat boʻlishi kerak." };
  }
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { status: "error", message: "Sessiya tugagan. Qaytadan kiring." };

  const { error } = await supabase.from("profiles").update({ full_name: parsed.data }).eq("id", user.id);
  if (error) return { status: "error", message: "Saqlab boʻlmadi. Birozdan keyin qayta urinib koʻring." };

  revalidatePath("/app", "layout");
  return { status: "saved" };
}
