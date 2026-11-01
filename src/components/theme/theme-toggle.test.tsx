import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "./theme-script";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("standart tanlov — qurilma temasi", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("radio", { name: "Qurilma temasi" })).toHaveAttribute("aria-checked", "true");
  });

  it("qorong'i temani yoqadi va tanlovni saqlaydi", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("radio", { name: "Qorongʻi tema" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("radio", { name: "Qorongʻi tema" })).toHaveAttribute("aria-checked", "true");

    await userEvent.click(screen.getByRole("radio", { name: "Yorugʻ tema" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});
