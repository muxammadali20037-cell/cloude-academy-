import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("label, izoh va boshqaruv elementini bog'laydi", () => {
    render(
      <Field label="Toʻliq ism" hint="Sertifikatda aynan shunday yoziladi" required>
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText(/Toʻliq ism/);
    expect(input).toHaveAccessibleDescription("Sertifikatda aynan shunday yoziladi");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("xato bo'lsa aria-invalid qo'yadi va xato matnini o'qitadi", () => {
    render(
      <Field label="Telefon raqam" hint="Masalan, 90 123 45 67" error="Raqam 9 ta raqamdan iborat boʻlishi kerak">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Telefon raqam");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Raqam 9 ta raqamdan iborat boʻlishi kerak");
    // Xato chiqqanda izoh yashiriladi — talaba bitta aniq ko'rsatmani ko'radi.
    expect(screen.queryByText("Masalan, 90 123 45 67")).not.toBeInTheDocument();
  });
});
