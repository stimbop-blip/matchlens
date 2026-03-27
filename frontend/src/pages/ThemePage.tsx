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

  const applyTheme = (next: AppTheme) => {
    setTheme(next);
    navigate("/menu");
  };

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={t("theme.title")}
          subtitle={t("theme.subtitle")}
        />

        <SettingsSection title={t("theme.section")}>
          <SettingsRow
            icon="🌙"
            title={t("theme.dark")}
            subtitle={t("theme.dark.desc")}
            onClick={() => applyTheme("dark")}
            right={
              <span className="theme-row-right">
                <span className="theme-swatch dark" />
                {theme === "dark" ? <span className="language-check">✓</span> : null}
              </span>
            }
          />
          <SettingsRow
            icon="☀️"
            title={t("theme.light")}
            subtitle={t("theme.light.desc")}
            onClick={() => applyTheme("light")}
            right={
              <span className="theme-row-right">
                <span className="theme-swatch light" />
                {theme === "light" ? <span className="language-check">✓</span> : null}
              </span>
            }
          />
        </SettingsSection>
      </AppShellSection>
    </Layout>
  );
}
