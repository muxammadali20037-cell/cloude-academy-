import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("matn, ro'yxat va kodni ko'rsatadi", () => {
    render(<Markdown>{"## Sarlavha\n\nOddiy **matn**.\n\n- birinchi\n- ikkinchi\n\n`<document>`"}</Markdown>);
    expect(screen.getByRole("heading", { level: 2, name: "Sarlavha" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("<document>")).toBeInTheDocument();
  });

  it("xom HTML va skriptlarni bajarmaydi", () => {
    const { container } = render(<Markdown>{'Salom <script>alert(1)</script><img src=x onerror="alert(1)">'}</Markdown>);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("havolalarni xavfsiz ochadi, javascript: havolasini bloklaydi", () => {
    render(<Markdown>{"[Hujjat](https://platform.claude.com/docs) va [xavfli](javascript:alert(1))"}</Markdown>);
    const link = screen.getByRole("link", { name: "Hujjat" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    const bad = screen.getByText("xavfli").closest("a");
    expect(bad?.getAttribute("href") ?? "").not.toContain("javascript:");
  });
});
