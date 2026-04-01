import { AdminPage } from "../pages/AdminPage";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";

export function Admin() {
  return (
    <PageTransition>
      <ErrorBoundary fallback={<AdminPage />}>
        <div className="pb-app-screen-shell pb-app-screen-admin">
          <AdminPage withThree />
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
