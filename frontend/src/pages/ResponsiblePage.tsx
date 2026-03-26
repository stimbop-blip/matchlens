import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";

export function ResponsiblePage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  return (
    <Layout>
      <section className="card home-section">
        <div className="section-head">
          <h2>{isRu ? "Ответственная игра" : "Responsible Play"}</h2>
          <span className="muted">PIT BET</span>
        </div>
        <div className="card-lite rules-note">
          <p>
            {isRu
              ? "Используйте только те суммы, потеря которых не повлияет на ваш ежедневный бюджет."
              : "Use only amounts that will not affect your everyday budget if lost."}
          </p>
        </div>
        <div className="card-lite rules-note">
          <p>
            {isRu
              ? "Делайте паузы, контролируйте эмоции и избегайте импульсивных решений."
              : "Take breaks, control emotions, and avoid impulsive decisions."}
          </p>
        </div>
        <div className="card-lite rules-note">
          <p>
            {isRu
              ? "PIT BET не гарантирует прибыль и не является финансовой рекомендацией."
              : "PIT BET does not guarantee profit and is not financial advice."}
          </p>
        </div>
      </section>
      <AppDisclaimer />
    </Layout>
  );
}
