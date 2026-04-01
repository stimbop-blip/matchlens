import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeVariant = "default" | "accent" | "accent2" | "success" | "warning";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: Props) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium",
        variant === "default" &&
          "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] text-[var(--text-secondary)]",
        variant === "accent" &&
          "border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--text-primary)]",
        variant === "accent2" &&
          "border-[color:color-mix(in_srgb,var(--accent-secondary)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--accent-secondary)_18%,transparent)] text-[var(--text-primary)]",
        variant === "success" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
        variant === "warning" && "border-amber-500/40 bg-amber-500/15 text-amber-300",
        className,
      )}
    />
  );
}
