import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "h-9 px-3 text-xs",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-sm",
        variant === "primary" &&
          "border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text-primary)] shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_20%,transparent)]",
        variant === "secondary" &&
          "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_80%,transparent)] text-[var(--text-primary)]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[color:color-mix(in_srgb,var(--surface)_65%,transparent)] hover:text-[var(--text-primary)]",
        className,
      )}
    />
  );
}
