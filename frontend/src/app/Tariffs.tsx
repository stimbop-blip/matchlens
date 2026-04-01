import { TariffsPage } from "../pages/TariffsPage";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";

export function Tariffs() {
  return (
    <PageTransition>
      <ErrorBoundary fallback={<TariffsPage />}>
        <div className="pb-app-screen-shell pb-app-screen-tariffs">
          <TariffsPage />
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
