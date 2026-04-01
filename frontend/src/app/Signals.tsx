import { FeedPage } from "../pages/FeedPage";
import { PageTransition } from "../components/motion/PageTransition";

export function Signals() {
  return (
    <PageTransition>
      <FeedPage useThreeCards />
    </PageTransition>
  );
}
