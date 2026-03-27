import { useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useLanguage, type AppLanguage } from "../app/language";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";

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
      <AppShellSection>
        <SectionHeader title={t("language.title")} subtitle={t("language.subtitle")} />

        <SettingsSection title={t("layout.title.language")}>
          <SettingsRow
            icon="RU"
            title={t("language.ru")}
            subtitle={t("language.optionRu")}
            onClick={() => apply("ru")}
            right={language === "ru" ? <span className="pb-check">*</span> : undefined}
          />
          <SettingsRow
            icon="EN"
            title={t("language.en")}
            subtitle={t("language.optionEn")}
            onClick={() => apply("en")}
            right={language === "en" ? <span className="pb-check">*</span> : undefined}
          />
        </SettingsSection>
      </AppShellSection>
    </Layout>
  );
}
