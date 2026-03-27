import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader } from "../components/ui";

export function RulesPage() {
  const { t } = useI18n();

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader title={t("rules.title")} subtitle={t("rules.subtitle")} />
        <div className="pb-article-stack">
          <p>{t("rules.p1")}</p>
          <p>{t("rules.p2")}</p>
          <p>{t("rules.p3")}</p>
        </div>
      </AppShellSection>
      <AppDisclaimer />
    </Layout>
  );
}
