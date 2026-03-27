import { useI18n } from "../app/i18n";
import { PremiumFooterNote } from "./ui";

export function AppDisclaimer() {
  const { t } = useI18n();

  return <PremiumFooterNote>{t("disclaimer")}</PremiumFooterNote>;
}
