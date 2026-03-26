import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { api, type PublicStats } from "../services/api";

export function StatsPage() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .stats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const isRu = language === "ru";

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>{isRu ? "Статистика PIT BET" : "PIT BET Statistics"}</h2>
          <span className="muted">{isRu ? "Прозрачные метрики" : "Transparent metrics"}</span>
        </div>

        <p className="stacked">
          {isRu
            ? "Метрики считаются по фактическим результатам без ручной корректировки."
            : "Metrics are calculated from actual outcomes without manual adjustments."}
        </p>

        {loading ? <p className="muted">{isRu ? "Обновляем показатели..." : "Loading metrics..."}</p> : null}
        {!loading && !stats ? <p className="empty-state">{isRu ? "Не удалось загрузить статистику." : "Failed to load statistics."}</p> : null}

        {stats ? (
          <>
            <div className="metrics-grid stats-screen-grid">
              <article>
                <span>{isRu ? "Всего прогнозов" : "Total predictions"}</span>
                <strong>{stats.total}</strong>
                <small>{isRu ? "в системе" : "in system"}</small>
              </article>
              <article>
                <span>{isRu ? "Точность" : "Hit rate"}</span>
                <strong>{stats.hit_rate}%</strong>
                <small>{isRu ? "победы / (победы + поражения)" : "wins / (wins + losses)"}</small>
              </article>
              <article>
                <span>ROI</span>
                <strong>{stats.roi}%</strong>
                <small>{isRu ? "по закрытым прогнозам" : "on settled predictions"}</small>
              </article>
              <article>
                <span>{isRu ? "В ожидании" : "Pending"}</span>
                <strong>{stats.pending}</strong>
                <small>{isRu ? "еще не рассчитаны" : "not settled yet"}</small>
              </article>
            </div>

            <div className="admin-grid-3" style={{ marginTop: 10 }}>
              <div className="card-lite">{isRu ? "Выигрышей" : "Wins"}: {stats.wins}</div>
              <div className="card-lite">{isRu ? "Поражений" : "Losses"}: {stats.loses}</div>
              <div className="card-lite">{isRu ? "Возвратов" : "Refunds"}: {stats.refunds}</div>
            </div>

            <h3>{isRu ? "Распределение по доступу" : "By access level"}</h3>
            <div className="admin-grid-3">
              <div className="card-lite">Free: {stats.by_access.free ?? 0}</div>
              <div className="card-lite">Premium: {stats.by_access.premium ?? 0}</div>
              <div className="card-lite">VIP: {stats.by_access.vip ?? 0}</div>
            </div>
          </>
        ) : null}
      </section>
      <AppDisclaimer />
    </Layout>
  );
}
