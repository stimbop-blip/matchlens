import type { AdminStats, Language } from "./shared";

type StatsTabProps = {
  language: Language;
  stats: AdminStats | null;
};

export function StatsTab({ language, stats }: StatsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  return (
    <div className="admin-panel">
      <div className="metrics-grid">
        <article>
          <span>{tx("Пользователи", "Users")}</span>
          <strong>{stats?.users_total ?? 0}</strong>
        </article>
        <article>
          <span>{tx("Активные подписки", "Active subscriptions")}</span>
          <strong>{stats?.active_subscriptions ?? 0}</strong>
        </article>
        <article>
          <span>{tx("Прогнозов", "Predictions")}</span>
          <strong>{stats?.predictions_total ?? 0}</strong>
        </article>
        <article>
          <span>{tx("Точность / ROI", "Hit rate / ROI")}</span>
          <strong>{stats?.hit_rate ?? 0}% / {stats?.roi ?? 0}%</strong>
        </article>
      </div>
      <div className="admin-grid-3">
        <div className="card-lite">{tx("Бесплатный", "Free")}: {stats?.users_by_access?.free ?? 0}</div>
        <div className="card-lite">{tx("Премиум", "Premium")}: {stats?.users_by_access?.premium ?? 0}</div>
        <div className="card-lite">VIP: {stats?.users_by_access?.vip ?? 0}</div>
      </div>
      <div className="admin-grid-4">
        <div className="card-lite">{tx("В ожидании", "Pending")}: {stats?.predictions_by_status?.pending ?? 0}</div>
        <div className="card-lite">{tx("Выигрыш", "Won")}: {stats?.predictions_by_status?.won ?? 0}</div>
        <div className="card-lite">{tx("Проигрыш", "Lost")}: {stats?.predictions_by_status?.lost ?? 0}</div>
        <div className="card-lite">{tx("Возврат", "Refund")}: {stats?.predictions_by_status?.refund ?? 0}</div>
      </div>
      <ul className="event-list">
        {(stats?.events_placeholder || []).map((event) => (
          <li key={event}>{event}</li>
        ))}
      </ul>
    </div>
  );
}
