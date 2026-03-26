import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api, type PublicStats } from "../services/api";

export function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string } | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null));
    api.mySubscription().then((s) => setSub({ tariff: s.tariff, status: s.status })).catch(() => setSub(null));
  }, []);

  return (
    <Layout>
      <section className="hero card">
        <h2>PIT BET: сигналы и контроль результата</h2>
        <p>PIT BET — сигналы, статистика и доступ к сильным прогнозам. Все метрики считаются по фактическим результатам.</p>
        <div className="cta-row">
          <Link className="btn" to="/feed">
            Открыть ленту
          </Link>
          <Link className="btn ghost" to="/tariffs">
            Тарифы
          </Link>
        </div>
      </section>

      <section className="card metrics-grid">
        <article>
          <span>Ваш доступ</span>
          <strong>{sub?.tariff?.toUpperCase() || "FREE"}</strong>
          <small>{sub?.status || "неактивен"}</small>
        </article>
        <article>
          <span>Прогнозов</span>
          <strong>{stats?.total ?? "--"}</strong>
          <small>в открытой витрине</small>
        </article>
        <article>
          <span>Точность</span>
          <strong>{stats ? `${stats.hit_rate}%` : "--"}</strong>
          <small>по закрытым исходам</small>
        </article>
        <article>
          <span>ROI</span>
          <strong>{stats ? `${stats.roi}%` : "--"}</strong>
          <small>пересчитывается по статусам</small>
        </article>
      </section>

      <section className="card">
        <h3>Как работать с PIT BET</h3>
        <p className="stacked">1) Начните с Free, чтобы оценить стиль отбора и качество сигналов.</p>
        <p className="stacked">2) Перейдите на Premium для полной ленты, уведомлений и разборов.</p>
        <p className="stacked">3) Если нужен максимум скорости и отбора — используйте VIP.</p>
      </section>
    </Layout>
  );
}
