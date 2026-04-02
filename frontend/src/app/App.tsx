import { Suspense, lazy } from "react";
import { BrowserRouter } from "react-router-dom";

import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { AppRouter } from "./router";

const ThreeBackgroundCanvas = lazy(() => import("../components/three/ThreeBackgroundCanvas").then((module) => ({ default: module.ThreeBackgroundCanvas })));

export function App() {
  return (
    <div className="pb-three-app-root">
      <ErrorBoundary fallback={<div className="pb-three-bg-fallback" aria-hidden="true" />}>
        <Suspense fallback={<div className="pb-three-bg-fallback" aria-hidden="true" />}>
          <ThreeBackgroundCanvas />
        </Suspense>
      </ErrorBoundary>

      <div className="pb-three-app-layer">
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </div>
    </div>
  );
}
