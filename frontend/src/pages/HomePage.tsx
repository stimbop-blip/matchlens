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
        <h2>Премиальная аналитика матчей</h2>
        <p>Следите за сигналами, риском и итогами в одном экране. Все метрики считаются по фактическим результатам.</p>
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
        <h3>Как использовать MatchLens</h3>
        <p className="stacked">1) Откройте ленту и выберите формат: прематч или лайв.</p>
        <p className="stacked">2) Сверьте коэффициент, уровень риска и статус расчета.</p>
        <p className="stacked">3) Для расширенного покрытия активируйте Premium или VIP.</p>
      </section>
    </Layout>
  );
}
