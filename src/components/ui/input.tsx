import { cn } from "@/lib/utils";

export const fieldControlClasses = [
  "w-full rounded-control border border-line-strong bg-canvas text-fg",
  "placeholder:text-fg-subtle",
  "transition-[border-color,box-shadow] duration-150",
  "hover:border-fg-subtle",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
  "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25",
];

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(fieldControlClasses, "h-11 px-3.5 text-[0.9375rem]", className)}
      {...props}
    />
  );
}
