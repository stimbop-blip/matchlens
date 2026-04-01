import { AdminPage } from "../pages/AdminPage";
import { PageTransition } from "../components/motion/PageTransition";

export function Admin() {
  return (
    <PageTransition>
      <AdminPage withThree />
    </PageTransition>
  );
}
