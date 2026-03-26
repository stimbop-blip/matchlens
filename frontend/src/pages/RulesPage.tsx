import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";

export function RulesPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  return (
    <Layout>
      <section className="card home-section">
        <div className="section-head">
          <h2>{isRu ? "Правила использования" : "Rules of Use"}</h2>
          <span className="muted">PIT BET</span>
        </div>
        <div className="card-lite rules-note">
          <p>
            {isRu
              ? "PIT BET предоставляет аналитические сигналы и статистику. Решения о ставках пользователь принимает самостоятельно."
              : "PIT BET provides analytical signals and statistics. Betting decisions are made by the user independently."}
          </p>
        </div>
        <div className="card-lite rules-note">
          <p>
            {isRu
              ? "Доступ к Premium и VIP материалам предоставляется в рамках выбранного тарифа и периода подписки."
              : "Access to Premium and VIP materials is provided within the selected tariff and subscription period."}
          </p>
        </div>
        <div className="card-lite rules-note">
          <p>
            {isRu
              ? "Используйте сервис ответственно и учитывайте личные финансовые ограничения."
              : "Use the service responsibly and consider your personal financial limits."}
          </p>
        </div>
      </section>
      <AppDisclaimer />
    </Layout>
  );
}
