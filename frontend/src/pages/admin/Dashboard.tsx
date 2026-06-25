import type { AdminStats, Language, Prediction, NewsPost, AdminPromoCode, AdminPayment } from "./shared";

type DashboardProps = {
  language: Language;
  stats: AdminStats | null;
  usersCount: number;
  predictions: Prediction[];
  payments: AdminPayment[];
  news: NewsPost[];
  promoCodes: AdminPromoCode[];
  onAddPrediction: () => void;
};

export function Dashboard({
  language,
  stats,
  usersCount,
  predictions,
  payments,
  news,
  promoCodes,
  onAddPrediction,
}: DashboardProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const pendingPredictions = predictions.filter((p) => p.status === "pending").length;
  const paymentsInReview = payments.filter((p) => p.status === "pending_manual_review" || p.status === "requires_clarification").length;
  const draftNews = news.filter((n) => !n.is_published).length;
  const activePromos = promoCodes.filter((p) => p.is_active).length;

  return (
    <div className="admin-dash-grid">
      <div className="admin-dash-card accent">
        <span className="label">
          <span>👥</span>
          {tx("Пользователи", "Users")}
        </span>
        <span className="value">{stats?.users_total ?? usersCount}</span>
      </div>

      <div className="admin-dash-card win">
        <span className="label">
          <span>✅</span>
          {tx("Активные подписки", "Active subscriptions")}
        </span>
        <span className="value">{stats?.active_subscriptions ?? 0}</span>
      </div>

      <div className="admin-dash-card warn">
        <span className="label">
          <span>⏳</span>
          {tx("Прогнозы в игре", "Predictions pending")}
        </span>
        <span className="value">{pendingPredictions}</span>
      </div>

      <div className="admin-dash-card warn">
        <span className="label">
          <span>💸</span>
          {tx("Платежи на проверке", "Payments in review")}
        </span>
        <span className="value">{paymentsInReview}</span>
      </div>

      <button className="admin-dash-cta" type="button" onClick={onAddPrediction} style={{ gridColumn: "1 / -1" }}>
        <span>➕</span>
        {tx("Добавить прогноз", "Add prediction")}
      </button>

      <div className="admin-dash-card">
        <span className="label">
          <span>📰</span>
          {tx("Черновики новостей", "News drafts")}
        </span>
        <span className="value">{draftNews}</span>
      </div>

      <div className="admin-dash-card">
        <span className="label">
          <span>🏷</span>
          {tx("Активные промо", "Active promo codes")}
        </span>
        <span className="value">{activePromos}</span>
      </div>
    </div>
  );
}
