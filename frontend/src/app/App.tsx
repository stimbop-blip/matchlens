import { Suspense, lazy } from "react";

import { MobileShell } from "../components/layout/MobileShell";
import { PageTransition } from "../components/motion/PageTransition";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

const ThreeBackgroundCanvas = lazy(() => import("../components/three/ThreeBackgroundCanvas").then((m) => ({ default: m.ThreeBackgroundCanvas })));

export default function App() {
  return (
    <AppProviders>
      <div className="app-bg min-h-screen">
        <Suspense fallback={null}>
          <ThreeBackgroundCanvas />
        </Suspense>
        <MobileShell withNav>
          <PageTransition>
            <AppRouter />
          </PageTransition>
        </MobileShell>
      </div>
    </AppProviders>
  );
}
