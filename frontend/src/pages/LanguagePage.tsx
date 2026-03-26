import { useNavigate } from "react-router-dom";

import { useLanguage, type AppLanguage } from "../app/language";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";

export function LanguagePage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const isRu = language === "ru";

  const applyLanguage = (next: AppLanguage) => {
    setLanguage(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Язык" : "Language"}
          subtitle={isRu ? "Выберите язык интерфейса PIT BET" : "Choose your PIT BET interface language"}
        />

        <SettingsSection title={isRu ? "Выбор языка" : "Language selection"}>
          <SettingsRow
            icon="🇷🇺"
            title="Русский"
            subtitle="Russian"
            onClick={() => applyLanguage("ru")}
            right={language === "ru" ? <span className="language-check">✓</span> : undefined}
          />
          <SettingsRow
            icon="🇬🇧"
            title="English"
            subtitle="English"
            onClick={() => applyLanguage("en")}
            right={language === "en" ? <span className="language-check">✓</span> : undefined}
          />
        </SettingsSection>
      </AppShellSection>
    </Layout>
  );
}
