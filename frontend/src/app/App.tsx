import { Suspense } from "react";

import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { MobileShell } from "../components/layout/MobileShell";
import { PageTransition } from "../components/motion/PageTransition";
import { ThreeBackgroundCanvas } from "../components/three/ThreeBackgroundCanvas";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

export default function App() {
  return (
    <AppProviders>
      <div className="app-bg min-h-screen">
        <ErrorBoundary fallback={null}>
          <ThreeBackgroundCanvas />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div className="glass rounded-2xl p-4 text-sm text-[var(--text-secondary)]">Loading...</div>}>
          <MobileShell withNav>
            <PageTransition>
              <Suspense fallback={<div className="glass rounded-2xl p-4 text-sm text-[var(--text-secondary)]">Loading...</div>}>
                <AppRouter />
              </Suspense>
            </PageTransition>
          </MobileShell>
        </ErrorBoundary>
      </div>
    </AppProviders>
  );
}
