"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-2 p-0.5 transition-colors",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-[1.125rem] rounded-full bg-canvas ring-1 ring-line-strong transition-transform duration-200 ease-(--ease-out-quint)",
          "data-[state=checked]:translate-x-5 data-[state=checked]:bg-white data-[state=checked]:ring-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
