import { useNavigate } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { useTheme } from "../app/language";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader, SettingsRow, SettingsSection } from "../components/ui";
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
      <AppShellSection>
        <SectionHeader title={t("theme.title")} subtitle={t("theme.subtitle")} />

        <SettingsSection title={t("layout.title.theme")}>
          <SettingsRow
            icon="DK"
            title={t("theme.dark")}
            subtitle={t("theme.darkDesc")}
            onClick={() => apply("dark")}
            right={theme === "dark" ? <span className="pb-check">*</span> : undefined}
          />
          <SettingsRow
            icon="LT"
            title={t("theme.light")}
            subtitle={t("theme.lightDesc")}
            onClick={() => apply("light")}
            right={theme === "light" ? <span className="pb-check">*</span> : undefined}
          />
        </SettingsSection>
      </AppShellSection>
    </Layout>
  );
}
