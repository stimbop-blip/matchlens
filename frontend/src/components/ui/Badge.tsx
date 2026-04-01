import { type HTMLAttributes } from "react";

import { cn } from "./cn";

type BadgeTone = "default" | "accent" | "vip";

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span {...props} className={cn("pb-tier-pill", tone !== "default" && tone, className)} />;
}
