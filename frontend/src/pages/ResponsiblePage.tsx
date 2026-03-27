import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader } from "../components/ui";

export function ResponsiblePage() {
  const { t } = useI18n();

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={t("responsible.title")}
          subtitle={t("responsible.subtitle")}
        />

        <div className="stack-list">
          <p>{t("responsible.p1")}</p>
          <p>{t("responsible.p2")}</p>
          <p>{t("responsible.p3")}</p>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
