import { MobileShell } from "../components/layout/MobileShell";
import { PageTransition } from "../components/motion/PageTransition";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

export default function App() {
  return (
    <AppProviders>
      <div className="app-bg min-h-screen">
        <MobileShell withNav>
          <PageTransition>
            <AppRouter />
          </PageTransition>
        </MobileShell>
      </div>
    </AppProviders>
  );
}
