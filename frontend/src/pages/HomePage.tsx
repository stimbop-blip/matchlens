import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api, type Me, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

function tariffLabel(value: string | null | undefined): string {
  if (value === "premium") return "Premium";
  if (value === "vip") return "VIP";
  return "Free";
}

function subscriptionStatusLabel(value: string | null | undefined): string {
  if (value === "active") return "Активна";
  if (value === "expired") return "Истекла";
  if (value === "canceled") return "Отменена";
  return "Не активирована";
}

function subscriptionTone(value: string | null | undefined): "success" | "warning" | "lost" | "pending" {
  if (value === "active") return "success";
  if (value === "expired") return "lost";
  if (value === "canceled") return "warning";
  return "pending";
}

function shortDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [pendingSignals, setPendingSignals] = useState<Prediction[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.me(),
      api.stats(),
      api.mySubscription(),
      api.news(),
      api.myReferral(),
      api.predictions({ status: "pending", limit: 100 }),
    ])
      .then(([meData, statsData, subData, newsData, referralData, pendingData]) => {
        setMe(meData);
        setStats(statsData);
        setSub({ tariff: subData.tariff, status: subData.status, ends_at: subData.ends_at });
        setNews(newsData);
        setReferral(referralData);
        setPendingSignals(pendingData);
      })
      .catch(() => {
        setMe(null);
        setStats(null);
        setSub(null);
        setNews([]);
        setReferral(null);
        setPendingSignals([]);
        setError("Не удалось загрузить часть данных. Попробуйте обновить экран.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const pendingFree = pendingSignals.filter((item) => item.access_level === "free").length;
  const pendingPremium = pendingSignals.filter((item) => item.access_level === "premium").length;
  const pendingVip = pendingSignals.filter((item) => item.access_level === "vip").length;
  const newsPreview = news.slice(0, 3);
  const mainCtaSecondary = sub?.status === "active" ? { to: "/profile", label: "Открыть профиль" } : { to: "/tariffs", label: "Выбрать тариф" };
  const displayName = me?.first_name || (me?.username ? `@${me.username}` : "Пользователь PIT BET");

  return (
    <Layout>
      <section className="card home-hero">
        <div className="home-hero-top">
          <div>
            <span className="home-eyebrow">PIT BET</span>
            <h2>Сигналы и аналитика в одном экране</h2>
          </div>
          <span className={`access-pill ${sub?.tariff || "free"}`}>{tariffLabel(sub?.tariff)}</span>
        </div>
        <p className="home-hero-copy">
          PIT BET отслеживает движение линии, коэффициенты, рыночные сигналы и игровые паттерны, чтобы выделять сильные игровые ситуации без лишнего шума.
        </p>
        <div className="home-hero-meta">
          <article>
            <span>Профиль</span>
            <strong>{displayName}</strong>
          </article>
          <article>
            <span>Статус доступа</span>
            <strong>
              <span className={`badge ${subscriptionTone(sub?.status)}`}>{subscriptionStatusLabel(sub?.status)}</span>
            </strong>
          </article>
        </div>
        <p className="home-note">Без обещаний гарантированной прибыли: только дисциплина, риск-контроль и статистика.</p>
        <div className="cta-row">
          <Link className="btn" to="/feed">
            Смотреть сигналы
          </Link>
          <Link className="btn ghost" to={mainCtaSecondary.to}>
            {mainCtaSecondary.label}
          </Link>
        </div>
      </section>

      <section className="card home-section">
        <div className="section-head">
          <h3>Главное сегодня</h3>
          <span className="muted">{loading ? "Обновляем" : "В фокусе"}</span>
        </div>
        <div className="home-today-grid">
          <article className="home-kpi primary">
            <span>Активных сигналов</span>
            <strong>{pendingSignals.length}</strong>
          </article>
          <article className="home-kpi free">
            <span>Free сейчас</span>
            <strong>{pendingFree}</strong>
          </article>
          <article className="home-kpi premium">
            <span>Premium сейчас</span>
            <strong>{pendingPremium}</strong>
          </article>
          <article className="home-kpi vip">
            <span>VIP сейчас</span>
            <strong>{pendingVip}</strong>
          </article>
        </div>
        <p className="home-inline-muted">
          В базе PIT BET: Free {stats?.by_access?.free ?? 0} • Premium {stats?.by_access?.premium ?? 0} • VIP {stats?.by_access?.vip ?? 0}
        </p>
        <div className="cta-row">
          <Link className="btn" to="/feed">
            Перейти в ленту
          </Link>
        </div>
      </section>

      <section className="card home-section">
        <div className="section-head">
          <h3>Преимущества PIT BET</h3>
          <span className="muted">Как устроен продукт</span>
        </div>
        <div className="home-benefits-grid">
          <article className="home-feature-card">
            <div className="home-feature-top">
              <span>⚡</span>
              <strong>Сигналы и фильтрация</strong>
            </div>
            <p>Прематч и лайв с фильтрами по риску, статусу и уровню доступа.</p>
          </article>
          <article className="home-feature-card">
            <div className="home-feature-top">
              <span>📊</span>
              <strong>Статистика и прозрачность</strong>
            </div>
            <p>Точность, ROI и история результатов считаются по фактическим исходам.</p>
          </article>
          <article className="home-feature-card">
            <div className="home-feature-top">
              <span>🔔</span>
              <strong>Уведомления</strong>
            </div>
            <p>Гибкие настройки сигналов и результатов под ваш ритм торговли линией.</p>
          </article>
          <article className="home-feature-card">
            <div className="home-feature-top">
              <span>🔐</span>
              <strong>Premium / VIP доступ</strong>
            </div>
            <p>Расширенный поток сигналов, ранние входы и приоритет по аналитике.</p>
          </article>
        </div>
      </section>

      <section className="card home-section">
        <div className="section-head">
          <h3>Новости PIT BET</h3>
          <span className="muted">Что происходит в проекте</span>
        </div>
        {newsPreview.length === 0 ? <p className="empty-state">Пока без публикаций. Следите за обновлениями в этой вкладке.</p> : null}
        <div className="home-news-list">
          {newsPreview.map((item) => (
            <article key={item.id} className="home-news-item">
              <div className="home-news-head">
                <strong>{item.title}</strong>
                <span className="badge info">{item.category}</span>
              </div>
              <p>{item.body}</p>
              <div className="home-news-meta">{shortDateTime(item.published_at)}</div>
            </article>
          ))}
        </div>
      </section>

      <div className="home-split">
        <section className="card home-section">
          <div className="section-head">
            <h3>Твой доступ</h3>
            <span className={`access-pill ${sub?.tariff || "free"}`}>{tariffLabel(sub?.tariff)}</span>
          </div>
          <div className="home-access-grid">
            <article className="home-access-item">
              <span>Тариф</span>
              <strong>{tariffLabel(sub?.tariff)}</strong>
            </article>
            <article className="home-access-item">
              <span>Статус</span>
              <strong>{subscriptionStatusLabel(sub?.status)}</strong>
            </article>
            <article className="home-access-item">
              <span>Доступ до</span>
              <strong>{shortDateTime(sub?.ends_at)}</strong>
            </article>
            <article className="home-access-item">
              <span>Уровень контента</span>
              <strong>{sub?.tariff === "vip" ? "Максимальный" : sub?.tariff === "premium" ? "Расширенный" : "Базовый"}</strong>
            </article>
          </div>
          <div className="cta-row">
            <Link className="btn" to={sub?.status === "active" ? "/profile" : "/tariffs"}>
              {sub?.status === "active" ? "Управлять доступом" : "Подключить доступ"}
            </Link>
          </div>
        </section>

        <section className="card home-section">
          <div className="section-head">
            <h3>Рефералы и промокоды</h3>
            <span className="muted">Рост доступа</span>
          </div>
          <p className="stacked">Приглашайте друзей, получайте бонусные дни и активируйте промокоды в профиле.</p>
          <div className="home-ref-grid">
            <article>
              <span>Приглашено</span>
              <strong>{referral?.invited ?? 0}</strong>
            </article>
            <article>
              <span>Активировано</span>
              <strong>{referral?.activated ?? 0}</strong>
            </article>
            <article>
              <span>Бонусных дней</span>
              <strong>{referral?.bonus_days ?? 0}</strong>
            </article>
          </div>
          <div className="cta-row">
            <Link className="btn ghost" to="/profile">
              Перейти в профиль
            </Link>
          </div>
        </section>
      </div>

      <section className="card home-section">
        <div className="section-head">
          <h3>Статистика</h3>
          <span className="muted">Краткий срез</span>
        </div>
        <div className="home-stats-grid">
          <article>
            <span>Прогнозов</span>
            <strong>{stats?.total ?? 0}</strong>
          </article>
          <article>
            <span>Точность</span>
            <strong>{stats ? `${stats.hit_rate}%` : "0%"}</strong>
          </article>
          <article>
            <span>ROI</span>
            <strong>{stats ? `${stats.roi}%` : "0%"}</strong>
          </article>
          <article>
            <span>Выигрышей</span>
            <strong>{stats?.wins ?? 0}</strong>
          </article>
          <article>
            <span>Поражений</span>
            <strong>{stats?.loses ?? 0}</strong>
          </article>
          <article>
            <span>Возвратов</span>
            <strong>{stats?.refunds ?? 0}</strong>
          </article>
        </div>
        <div className="cta-row">
          <Link className="btn ghost" to="/stats">
            Открыть статистику
          </Link>
        </div>
      </section>

      {error ? <p className="notice error">{error}</p> : null}
    </Layout>
  );
}
