import { useEffect, useState } from "react";

import { Layout } from "../components/Layout";
import { api } from "../services/api";

export function StatsPage() {
  const [stats, setStats] = useState<{ total: number; winrate: number; roi: number } | null>(null);
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
          <h2>Статистика качества</h2>
          <span className="muted">обновление в реальном времени</span>
        </div>
        {loading ? <p>Считаем показатели...</p> : null}
        {!loading && !stats ? <p className="empty-state">Статистика временно недоступна.</p> : null}

        {stats ? (
          <div className="metrics-grid">
            <article>
              <span>Всего прогнозов</span>
              <strong>{stats.total}</strong>
              <small>публичная витрина</small>
            </article>
            <article>
              <span>Winrate</span>
              <strong>{stats.winrate}%</strong>
              <small>по закрытым исходам</small>
            </article>
            <article>
              <span>ROI</span>
              <strong>{stats.roi}%</strong>
              <small>финальный расчет в разработке</small>
            </article>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}
