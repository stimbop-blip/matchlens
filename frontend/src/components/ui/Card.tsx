import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  neon?: boolean;
};

export function Card({ className, neon = false, ...props }: Props) {
  return (
    <div
      {...props}
      className={cn(
        "glass rounded-[22px] border border-[var(--border)] p-4",
        neon &&
          "shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_36%,transparent),0_0_28px_color-mix(in_srgb,var(--accent)_18%,transparent)]",
        className,
      )}
    />
  );
}
