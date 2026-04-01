import { ProfilePage } from "../pages/ProfilePage";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";

export function Profile() {
  return (
    <PageTransition>
      <ErrorBoundary fallback={<ProfilePage />}>
        <div className="pb-app-screen-shell pb-app-screen-profile">
          <ProfilePage withThree />
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
