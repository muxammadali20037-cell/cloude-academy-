"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function FormDemo() {
  const [reminders, setReminders] = useState(true);

  return (
    <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      <div className="space-y-5">
        <Field label="Toʻliq ism" hint="Sertifikatda aynan shunday yoziladi" required>
          <Input placeholder="Masalan, Dilnoza Karimova" autoComplete="name" />
        </Field>

        <Field
          label="Telefon raqam"
          error="Raqam 9 ta raqamdan iborat boʻlishi kerak, masalan 90 123 45 67"
        >
          <Input type="tel" inputMode="tel" defaultValue="90 123 45" autoComplete="tel-national" />
        </Field>

        <Field label="Email" hint="Kirish kodi shu manzilga yuboriladi">
          <Input type="email" placeholder="ism@misol.uz" autoComplete="email" disabled />
        </Field>
      </div>

      <div className="space-y-5">
        <Field label="Promptingiz" hint="Rol, kontekst va kutilgan natija formatini yozing">
          <Textarea
            mono
            rows={5}
            defaultValue={"<role>Siz tajribali marketologsiz</role>\n<task>Yangi kafe uchun 3 ta Instagram post gʻoyasini yozing</task>"}
          />
        </Field>

        <div className="flex items-center gap-3">
          <Checkbox id="terms" defaultChecked />
          <Label htmlFor="terms">Ommaviy oferta shartlariga roziman</Label>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-control bg-surface px-4 py-3">
          <div>
            <Label htmlFor="reminders">Kundalik eslatma</Label>
            <p className="text-sm text-fg-subtle">
              {reminders ? "Har kuni soat 20:00 da" : "Eslatmalar oʻchirilgan"}
            </p>
          </div>
          <Switch id="reminders" checked={reminders} onCheckedChange={setReminders} />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fg">Qayerdan boshlaysiz?</legend>
          <RadioGroup defaultValue="diagnostic">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="diagnostic" id="start-diagnostic" />
              <Label htmlFor="start-diagnostic">Diagnostik test natijasidan</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="beginning" id="start-beginning" />
              <Label htmlFor="start-beginning">Kursning eng boshidan</Label>
            </div>
          </RadioGroup>
        </fieldset>
      </div>
    </div>
  );
}
