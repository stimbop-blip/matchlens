import { ProfilePage } from "../pages/ProfilePage";
import { PageTransition } from "../components/motion/PageTransition";

export function Profile() {
  return (
    <PageTransition>
      <ProfilePage withThree />
    </PageTransition>
  );
}
