import { TariffsPage } from "../pages/TariffsPage";
import { PageTransition } from "../components/motion/PageTransition";

export function Tariffs() {
  return (
    <PageTransition>
      <TariffsPage />
    </PageTransition>
  );
}
