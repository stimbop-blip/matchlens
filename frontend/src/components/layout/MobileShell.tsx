import type { PropsWithChildren } from "react";
import { BottomNav } from "./BottomNav";

type MobileShellProps = PropsWithChildren<{
  withNav?: boolean;
  className?: string;
}>;

export function MobileShell({ children, withNav = true, className }: MobileShellProps) {
  return (
    <div className="app-bg min-h-screen">
      <main className={`app-content mx-auto w-full max-w-md px-3 pt-3 ${withNav ? "safe-bottom" : ""} ${className ?? ""}`}>
        {children}
      </main>
      {withNav ? <BottomNav /> : null}
    </div>
  );
}
