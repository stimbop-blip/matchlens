import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api, type NewsPost, type PublicStats } from "../services/api";

export function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);

  useEffect(() => {
    Promise.all([api.stats(), api.mySubscription(), api.news()])
      .then(([statsData, subData, newsData]) => {
        setStats(statsData);
        setSub({ tariff: subData.tariff, status: subData.status });
        setNews(newsData);
      })
      .catch(() => {
        setStats(null);
        setSub(null);
        setNews([]);
      });
  }, []);

  return (
    <Layout>
      <section className="hero card">
        <h2>PIT BET</h2>
        <p>
          PIT BET — сигналы, статистика и доступ к сильным прогнозам. Платформа отслеживает движение линии,
          коэффициенты, рыночные сигналы, форму и паттерны матчей для отбора сильных игровых ситуаций.
        </p>
        <div className="cta-row">
          <Link className="btn" to="/feed">
            Актуальные сигналы
          </Link>
          <Link className="btn ghost" to="/tariffs">
            Тарифы PIT BET
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Актуальные сигналы</h3>
          <span className="muted">{sub?.tariff?.toUpperCase() || "FREE"}</span>
        </div>
        <p className="stacked">Выбирайте формат: прематч или лайв, фильтруйте по статусу и уровню доступа.</p>
        <p className="stacked">Каждый сигнал оформлен с короткой аналитикой и рыночным контекстом.</p>
        <Link className="btn" to="/feed">
          Перейти в ленту
        </Link>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Новости PIT BET</h3>
          <span className="muted">Апдейты и анонсы</span>
        </div>
        {news.length === 0 ? <p className="empty-state">Новостей пока нет. Следите за обновлениями PIT BET.</p> : null}
        {news.slice(0, 5).map((item) => (
          <article key={item.id} className="prediction-card">
            <div className="prediction-top">
              <strong>{item.title}</strong>
              <span className="badge info">{item.category}</span>
            </div>
            <p className="stacked">{item.body}</p>
            <p className="muted">{item.published_at ? new Date(item.published_at).toLocaleString("ru-RU") : "Без даты"}</p>
          </article>
        ))}
      </section>

      <section className="card metrics-grid">
        <article>
          <span>Прогнозов</span>
          <strong>{stats?.total ?? "--"}</strong>
          <small>в статистике платформы</small>
        </article>
        <article>
          <span>Точность</span>
          <strong>{stats ? `${stats.hit_rate}%` : "--"}</strong>
          <small>по закрытым исходам</small>
        </article>
        <article>
          <span>ROI</span>
          <strong>{stats ? `${stats.roi}%` : "--"}</strong>
          <small>с учетом возвратов</small>
        </article>
        <article>
          <span>В ожидании</span>
          <strong>{stats?.pending ?? "--"}</strong>
          <small>активные сигналы</small>
        </article>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Тарифы PIT BET</h3>
          <span className="muted">Free / Premium / VIP</span>
        </div>
        <p className="stacked">Free — входной уровень для знакомства с платформой.</p>
        <p className="stacked">Premium — основной ежедневный доступ: полная лента, уведомления и разборы.</p>
        <p className="stacked">VIP — максимум доступа: ранние сигналы, лайв-отбор и расширенная аналитика.</p>
        <Link className="btn" to="/tariffs">
          Сравнить тарифы
        </Link>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Личный кабинет</h3>
          <span className="muted">Профиль и настройки</span>
        </div>
        <p className="stacked">Управляйте уведомлениями, активируйте промокоды и отслеживайте реферальную статистику.</p>
        <Link className="btn ghost" to="/profile">
          Открыть профиль
        </Link>
      </section>
    </Layout>
  );
}
