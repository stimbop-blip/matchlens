import { type HTMLAttributes } from "react";

import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section {...props} className={cn("pb-premium-panel", className)} />;
}
