import { useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useLanguage, type AppLanguage } from "../app/language";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";

export function LanguagePage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();

  const applyLanguage = (next: AppLanguage) => {
    setLanguage(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={t("language.title")}
          subtitle={t("language.subtitle")}
        />

        <SettingsSection title={t("language.section")}>
          <SettingsRow
            icon="🇷🇺"
            title={t("language.ru")}
            subtitle={t("language.option.ru")}
            onClick={() => applyLanguage("ru")}
            right={language === "ru" ? <span className="language-check">✓</span> : undefined}
          />
          <SettingsRow
            icon="🇬🇧"
            title={t("language.en")}
            subtitle={t("language.option.en")}
            onClick={() => applyLanguage("en")}
            right={language === "en" ? <span className="language-check">✓</span> : undefined}
          />
        </SettingsSection>
      </AppShellSection>
    </Layout>
  );
}
