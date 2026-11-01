import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("standart holatda type=button bo'ladi (formani tasodifan yubormaydi)", () => {
    render(<Button>Davom ettirish</Button>);
    expect(screen.getByRole("button", { name: "Davom ettirish" })).toHaveAttribute("type", "button");
  });

  it("loading holatida bloklanadi va aria-busy beradi", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Tekshirilmoqda
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Tekshirilmoqda" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("asChild bilan havolani tugma uslubida chizadi", () => {
    render(
      <Button asChild variant="link">
        <a href="#mashq">Mashqqa oʻtish</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Mashqqa oʻtish" });
    expect(link).toHaveAttribute("href", "#mashq");
    expect(link.className).toContain("underline-offset-4");
  });
});
