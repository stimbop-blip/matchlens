import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader } from "../components/ui";

export function ResponsiblePage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Ответственная игра" : "Responsible play"}
          subtitle={isRu ? "Безопасный подход к ставкам" : "Safe betting behavior"}
        />

        <div className="stack-list">
          <p>
            {isRu
              ? "Используйте только те суммы, потеря которых не влияет на повседневный бюджет."
              : "Use only amounts that do not affect your day-to-day budget if lost."}
          </p>
          <p>
            {isRu
              ? "Делайте паузы, сохраняйте контроль над эмоциями и не принимайте импульсивных решений."
              : "Take breaks, stay in control of emotions, and avoid impulsive decisions."}
          </p>
          <p>
            {isRu
              ? "PIT BET не гарантирует прибыль и не является финансовой рекомендацией."
              : "PIT BET does not guarantee profit and is not financial advice."}
          </p>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
