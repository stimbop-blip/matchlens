import { useEffect, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type PublicStats } from "../services/api";

export function StatsPage() {
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

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Статистика PIT BET</h2>
          <span className="muted">Прозрачные расчеты по сигналам и результатам</span>
        </div>

        <p className="stacked">Все показатели считаются по фактическим исходам без ручной подгонки.</p>

        {loading ? <p className="muted">Обновляем показатели...</p> : null}
        {!loading && !stats ? <p className="empty-state">Не удалось загрузить статистику PIT BET.</p> : null}

        {stats ? (
          <>
            <div className="metrics-grid">
              <article>
                <span>Всего прогнозов</span>
                <strong>{stats.total}</strong>
                <small>в системе</small>
              </article>
              <article>
                <span>Точность</span>
                <strong>{stats.hit_rate}%</strong>
                <small>победы / (победы + поражения)</small>
              </article>
              <article>
                <span>ROI</span>
                <strong>{stats.roi}%</strong>
                <small>по закрытым прогнозам</small>
              </article>
              <article>
                <span>В ожидании</span>
                <strong>{stats.pending}</strong>
                <small>еще не рассчитаны</small>
              </article>
            </div>

            <div className="admin-grid-3" style={{ marginTop: 10 }}>
              <div className="card-lite">Выигрышей: {stats.wins}</div>
              <div className="card-lite">Поражений: {stats.loses}</div>
              <div className="card-lite">Возвратов: {stats.refunds}</div>
            </div>

            <h3>Распределение по доступу</h3>
            <div className="admin-grid-3">
              <div className="card-lite">Бесплатный: {stats.by_access.free ?? 0}</div>
              <div className="card-lite">Премиум: {stats.by_access.premium ?? 0}</div>
              <div className="card-lite">VIP: {stats.by_access.vip ?? 0}</div>
            </div>
          </>
        ) : null}
      </section>
    </Layout>
  );
}
