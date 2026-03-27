import { useI18n } from "../app/i18n";

export function AppDisclaimer() {
  const { t } = useI18n();
  const text = t("disclaimer");

  return (
    <footer className="app-disclaimer" role="note" aria-live="polite">
      {text}
    </footer>
  );
}
