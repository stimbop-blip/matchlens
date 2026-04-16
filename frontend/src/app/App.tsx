import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { AppRouter } from "./router";

const ThreeBackgroundCanvas = lazy(() => import("../components/three/ThreeBackgroundCanvas").then((module) => ({ default: module.ThreeBackgroundCanvas })));

export function App() {
  const [showThreeBackground, setShowThreeBackground] = useState(false);

  useEffect(() => {
    const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mediaSmall = window.matchMedia("(max-width: 820px)").matches;
    const mediaCoarse = window.matchMedia("(pointer: coarse)").matches;
    const cores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lowPower = cores <= 4 || memory <= 4;

    setShowThreeBackground(!(mediaReduced || (mediaSmall && mediaCoarse) || lowPower));
  }, []);

  return (
    <div className="pb-three-app-root">
      {showThreeBackground ? (
        <ErrorBoundary fallback={<div className="pb-three-bg-fallback" aria-hidden="true" />}>
          <Suspense fallback={<div className="pb-three-bg-fallback" aria-hidden="true" />}>
            <ThreeBackgroundCanvas />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="pb-three-bg-fallback" aria-hidden="true" />
      )}

      <div className="pb-three-app-layer">
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </div>
    </div>
  );
}
