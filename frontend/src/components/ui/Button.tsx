import { type ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cn(
        "pb-btn",
        variant === "primary" && "pb-btn-primary",
        variant === "secondary" && "pb-btn-secondary",
        variant === "ghost" && "pb-btn-ghost",
        className,
      )}
    />
  );
}
