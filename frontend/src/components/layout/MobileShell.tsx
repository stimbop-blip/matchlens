import { type PropsWithChildren } from "react";

export function MobileShell({ children }: PropsWithChildren) {
  return <div className="pb-app-shell">{children}</div>;
}
