import { FeedPage } from "../pages/FeedPage";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";

export function Signals() {
  return (
    <PageTransition>
      <ErrorBoundary fallback={<FeedPage />}>
        <FeedPage useThreeCards />
      </ErrorBoundary>
    </PageTransition>
  );
}
