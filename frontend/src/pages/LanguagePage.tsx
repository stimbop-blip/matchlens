import { useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useLanguage, type AppLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader } from "../components/ui";

export function LanguagePage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();

  const apply = (next: AppLanguage) => {
    setLanguage(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className="pb-live-pill">{language.toUpperCase()}</span>
        </div>
        <h2>{t("language.title")}</h2>
        <p>{t("language.subtitle")}</p>
      </section>

      <AppShellSection>
        <SectionHeader title={t("layout.title.language")} subtitle={t("language.subtitle")} />

        <div className="pb-choice-grid">
          <button type="button" className={language === "ru" ? "pb-choice-card active" : "pb-choice-card"} onClick={() => apply("ru")}>
            <span className="pb-choice-flag" aria-hidden="true">
              RU
            </span>
            <strong>{t("language.ru")}</strong>
            <p>{t("language.optionRu")}</p>
          </button>
          <button type="button" className={language === "en" ? "pb-choice-card active" : "pb-choice-card"} onClick={() => apply("en")}>
            <span className="pb-choice-flag" aria-hidden="true">
              EN
            </span>
            <strong>{t("language.en")}</strong>
            <p>{t("language.optionEn")}</p>
          </button>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
