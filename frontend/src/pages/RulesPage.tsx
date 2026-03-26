import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, SectionHeader } from "../components/ui";

export function RulesPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Правила использования" : "Rules of use"}
          subtitle={isRu ? "Базовые принципы работы сервиса" : "Core service usage principles"}
        />

        <div className="stack-list">
          <p>
            {isRu
              ? "PIT BET предоставляет аналитические сигналы и статистику. Финальное решение по ставкам пользователь принимает самостоятельно."
              : "PIT BET provides analytical signals and statistics. Final betting decisions are made by the user."}
          </p>
          <p>
            {isRu
              ? "Доступ к Premium и VIP материалам действует в рамках выбранного тарифа и срока подписки."
              : "Access to Premium and VIP content is available within the selected plan and subscription period."}
          </p>
          <p>
            {isRu
              ? "Используйте сервис ответственно и учитывайте личные финансовые ограничения."
              : "Use the service responsibly and consider your personal financial limits."}
          </p>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
