import { ProfilePage } from "../pages/ProfilePage";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";

export function Profile() {
  return (
    <PageTransition>
      <ErrorBoundary fallback={<ProfilePage />}>
        <ProfilePage withThree />
      </ErrorBoundary>
    </PageTransition>
  );
}
