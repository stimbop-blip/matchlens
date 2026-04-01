import { Suspense, lazy, useEffect, useState } from "react";

import { MobileShell } from "../components/layout/MobileShell";
import { PageTransition } from "../components/motion/PageTransition";
import { ThreeFallbackBoundary } from "../components/three/ThreeFallbackBoundary";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

const ThreeBackgroundCanvas = lazy(() => import("../components/three/ThreeBackgroundCanvas").then((m) => ({ default: m.ThreeBackgroundCanvas })));

export default function App() {
  const [showThree, setShowThree] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShowThree(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <AppProviders>
      <div className="app-bg min-h-screen">
        {showThree ? (
          <ThreeFallbackBoundary fallback={null}>
            <Suspense fallback={null}>
              <ThreeBackgroundCanvas />
            </Suspense>
          </ThreeFallbackBoundary>
        ) : null}
        <MobileShell withNav>
          <PageTransition>
            <AppRouter />
          </PageTransition>
        </MobileShell>
      </div>
    </AppProviders>
  );
}
