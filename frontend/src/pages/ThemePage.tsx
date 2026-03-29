import { useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useTheme } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader } from "../components/ui";
import type { AppTheme } from "../services/telegram";

export function ThemePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  const apply = (next: AppTheme) => {
    setTheme(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className="pb-live-pill">{theme === "dark" ? "DK" : "LT"}</span>
        </div>
        <h2>{t("theme.title")}</h2>
        <p>{t("theme.subtitle")}</p>
      </section>

      <AppShellSection>
        <SectionHeader title={t("layout.title.theme")} subtitle={t("theme.subtitle")} />

        <div className="pb-choice-grid">
          <button type="button" className={theme === "dark" ? "pb-choice-card active" : "pb-choice-card"} onClick={() => apply("dark")}>
            <span className="pb-choice-flag" aria-hidden="true">
              DK
            </span>
            <strong>{t("theme.dark")}</strong>
            <p>{t("theme.darkDesc")}</p>
          </button>
          <button type="button" className={theme === "light" ? "pb-choice-card active" : "pb-choice-card"} onClick={() => apply("light")}>
            <span className="pb-choice-flag" aria-hidden="true">
              LT
            </span>
            <strong>{t("theme.light")}</strong>
            <p>{t("theme.lightDesc")}</p>
          </button>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
