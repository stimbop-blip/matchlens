import { useNavigate } from "react-router-dom";

import { useLanguage, useTheme } from "../app/language";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
import type { AppTheme } from "../services/telegram";

export function ThemePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isRu = language === "ru";

  const applyTheme = (next: AppTheme) => {
    setTheme(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Тема" : "Theme"}
          subtitle={isRu ? "Выберите визуальный режим" : "Choose visual mode"}
        />

        <SettingsSection title={isRu ? "Варианты" : "Options"}>
          <SettingsRow
            icon="🌙"
            title={isRu ? "Темная" : "Dark"}
            subtitle={isRu ? "Глубокий контраст и мягкий фон" : "Deep contrast and calm surfaces"}
            onClick={() => applyTheme("dark")}
            right={theme === "dark" ? <span className="language-check">✓</span> : undefined}
          />
          <SettingsRow
            icon="☀️"
            title={isRu ? "Светлая" : "Light"}
            subtitle={isRu ? "Чистый светлый интерфейс" : "Clean bright interface"}
            onClick={() => applyTheme("light")}
            right={theme === "light" ? <span className="language-check">✓</span> : undefined}
          />
        </SettingsSection>
      </AppShellSection>
    </Layout>
  );
}
