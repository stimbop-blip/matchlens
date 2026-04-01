import { FeedPage } from "../pages/FeedPage";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";

export function Signals() {
  return (
    <PageTransition>
      <ErrorBoundary fallback={<FeedPage />}>
        <div className="pb-app-screen-shell pb-app-screen-signals">
          <FeedPage useThreeCards />
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
