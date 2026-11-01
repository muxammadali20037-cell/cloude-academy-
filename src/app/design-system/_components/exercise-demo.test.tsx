import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExerciseDemo } from "./exercise-demo";

describe("ExerciseDemo — mashq oqimi", () => {
  it("javob tanlanmaguncha tekshirib bo'lmaydi", () => {
    render(<ExerciseDemo />);
    expect(screen.getByRole("button", { name: "Tekshirish" })).toBeDisabled();
  });

  it("xato javobda to'liq izoh va o'xshash mashq chiqadi", async () => {
    const user = userEvent.setup();
    render(<ExerciseDemo />);
    await user.click(screen.getByRole("radio", { name: /Hujjatdan oldin/ }));
    await user.click(screen.getByRole("button", { name: "Tekshirish" }));

    expect(screen.getByRole("status")).toHaveTextContent("Notoʻgʻri javob");
    expect(screen.getByText(/Siz “Hujjatdan oldin, eng boshida” variantini tanladingiz/)).toBeInTheDocument();
    // To'g'ri variant belgilanadi, variantlar qayta bosilmaydi.
    expect(screen.getByRole("radio", { name: /Hujjatdan keyin/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Oʻxshash mashq" }));
    expect(screen.getByText("Savol 2, jami 2")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("to'g'ri javobda keyingi savolga o'tadi", async () => {
    const user = userEvent.setup();
    render(<ExerciseDemo />);
    await user.click(screen.getByRole("radio", { name: /Hujjatdan keyin/ }));
    await user.click(screen.getByRole("button", { name: "Tekshirish" }));
    expect(screen.getByRole("status")).toHaveTextContent("Toʻgʻri javob");
    await user.click(screen.getByRole("button", { name: "Keyingi savol" }));
    expect(screen.getByText("Savol 2, jami 2")).toBeInTheDocument();
  });

  it("qayta urinish tanlovni tozalaydi", async () => {
    const user = userEvent.setup();
    render(<ExerciseDemo />);
    await user.click(screen.getByRole("radio", { name: /oʻrtasida/ }));
    await user.click(screen.getByRole("button", { name: "Tekshirish" }));
    await user.click(screen.getByRole("button", { name: "Qayta urinish" }));
    expect(screen.getByRole("button", { name: "Tekshirish" })).toBeDisabled();
    expect(screen.getByText("Savol 1, jami 2")).toBeInTheDocument();
  });
});
