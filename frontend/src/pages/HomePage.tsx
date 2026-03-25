import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api } from "../services/api";

export function HomePage() {
  const [stats, setStats] = useState<{ total: number; winrate: number; roi: number } | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string } | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null));
    api.mySubscription().then((s) => setSub({ tariff: s.tariff, status: s.status })).catch(() => setSub(null));
  }, []);

  return (
    <Layout>
      <section className="hero card">
        <h2>Премиум аналитика матчей</h2>
        <p>Вся работа в одном экране: сигналы, риски, доступы и факт-статистика по результатам.</p>
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
          <small>{sub?.status || "inactive"}</small>
        </article>
        <article>
          <span>Прогнозов</span>
          <strong>{stats?.total ?? "--"}</strong>
          <small>в открытой витрине</small>
        </article>
        <article>
          <span>Winrate</span>
          <strong>{stats ? `${stats.winrate}%` : "--"}</strong>
          <small>по закрытым исходам</small>
        </article>
        <article>
          <span>ROI</span>
          <strong>{stats ? `${stats.roi}%` : "--"}</strong>
          <small>сейчас в разработке</small>
        </article>
      </section>

      <section className="card">
        <h3>Как использовать MatchLens</h3>
        <p className="stacked">1) Откройте ленту и отфильтруйте формат сигнала.</p>
        <p className="stacked">2) Проверьте коэффициент, риск и статус публикации.</p>
        <p className="stacked">3) Для расширенного доступа используйте Premium или VIP.</p>
      </section>
    </Layout>
  );
}
