import { cn } from "@/lib/utils";
import { fieldControlClasses } from "./input";

export type TextareaProps = React.ComponentProps<"textarea"> & {
  /** Kod yoki prompt yozish uchun monospace shrift. */
  mono?: boolean;
};

export function Textarea({ className, mono = false, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        fieldControlClasses,
        "min-h-24 resize-y px-3.5 py-3 text-[0.9375rem] leading-relaxed",
        mono && "font-mono text-sm",
        className,
      )}
      {...props}
    />
  );
}
