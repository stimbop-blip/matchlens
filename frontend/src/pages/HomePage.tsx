import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { api, type Me, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

function tariffLabel(value: string | null | undefined): string {
  if (value === "premium") return "Premium";
  if (value === "vip") return "VIP";
  return "Free";
}

function shortDateTime(value: string | null | undefined, language: "ru" | "en"): string {
  if (!value) return language === "ru" ? "Без даты" : "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "ru" ? "Без даты" : "No date";
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(value: string | null | undefined, language: "ru" | "en") {
  if (value === "active") return language === "ru" ? "Активна" : "Active";
  if (value === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (value === "canceled") return language === "ru" ? "Отменена" : "Canceled";
  return language === "ru" ? "Не активна" : "Inactive";
}

function statusTone(value: string | null | undefined): "success" | "warning" | "lost" | "pending" {
  if (value === "active") return "success";
  if (value === "expired") return "lost";
  if (value === "canceled") return "warning";
  return "pending";
}

export function HomePage() {
  const { language } = useLanguage();
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [pendingSignals, setPendingSignals] = useState<Prediction[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
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
      });
  }, []);

  const isRu = language === "ru";
  const pendingFree = pendingSignals.filter((item) => item.access_level === "free").length;
  const pendingPremium = pendingSignals.filter((item) => item.access_level === "premium").length;
  const pendingVip = pendingSignals.filter((item) => item.access_level === "vip").length;
  const newsPreview = news.slice(0, 2);
  const displayName = me?.first_name || (me?.username ? `@${me.username}` : isRu ? "Пользователь PIT BET" : "PIT BET user");

  return (
    <Layout>
      <section className="card home-hero">
        <div className="home-hero-top">
          <div>
            <span className="home-eyebrow">PIT BET</span>
            <h2>{isRu ? "Сигналы и аналитика каждый день" : "Signals and analytics every day"}</h2>
          </div>
          <span className={`access-pill ${sub?.tariff || "free"}`}>{tariffLabel(sub?.tariff)}</span>
        </div>
        <p className="home-hero-copy">
          {isRu
            ? "Платформа отслеживает движение линии, коэффициенты, рыночные сигналы и игровые паттерны, чтобы выделять сильные игровые ситуации."
            : "The platform tracks line movement, odds, market signals, and game patterns to highlight strong market opportunities."}
        </p>
        <div className="home-hero-meta">
          <article>
            <span>{isRu ? "Профиль" : "Profile"}</span>
            <strong>{displayName}</strong>
          </article>
          <article>
            <span>{isRu ? "Статус доступа" : "Access status"}</span>
            <strong>
              <span className={`badge ${statusTone(sub?.status)}`}>{statusLabel(sub?.status, language)}</span>
            </strong>
          </article>
        </div>
        <div className="cta-row">
          <Link className="btn" to="/feed">
            {isRu ? "Открыть ленту" : "Open feed"}
          </Link>
          <Link className="btn ghost" to="/tariffs">
            {isRu ? "Тарифы" : "Tariffs"}
          </Link>
        </div>
      </section>

      <section className="card home-section">
        <div className="section-head">
          <h3>{isRu ? "Главное сегодня" : "Today at a glance"}</h3>
          <span className="muted">{isRu ? "PIT BET" : "PIT BET"}</span>
        </div>
        <div className="home-today-grid">
          <article className="home-kpi primary">
            <span>{isRu ? "Активных сигналов" : "Active signals"}</span>
            <strong>{pendingSignals.length}</strong>
          </article>
          <article className="home-kpi free">
            <span>Free</span>
            <strong>{pendingFree}</strong>
          </article>
          <article className="home-kpi premium">
            <span>Premium</span>
            <strong>{pendingPremium}</strong>
          </article>
          <article className="home-kpi vip">
            <span>VIP</span>
            <strong>{pendingVip}</strong>
          </article>
        </div>
        <div className="home-quick-grid">
          <Link to="/feed" className="menu-shortcut">
            <span>⚡</span>
            <b>{isRu ? "Лента" : "Feed"}</b>
          </Link>
          <Link to="/stats" className="menu-shortcut">
            <span>📊</span>
            <b>{isRu ? "Статистика" : "Stats"}</b>
          </Link>
          <Link to="/tariffs" className="menu-shortcut">
            <span>💎</span>
            <b>{isRu ? "Тарифы" : "Tariffs"}</b>
          </Link>
        </div>
      </section>

      <div className="home-split">
        <section className="card home-section">
          <div className="section-head">
            <h3>{isRu ? "Твой доступ" : "Your access"}</h3>
            <span className={`access-pill ${sub?.tariff || "free"}`}>{tariffLabel(sub?.tariff)}</span>
          </div>
          <div className="home-access-grid">
            <article className="home-access-item">
              <span>{isRu ? "Тариф" : "Tariff"}</span>
              <strong>{tariffLabel(sub?.tariff)}</strong>
            </article>
            <article className="home-access-item">
              <span>{isRu ? "Статус" : "Status"}</span>
              <strong>{statusLabel(sub?.status, language)}</strong>
            </article>
            <article className="home-access-item">
              <span>{isRu ? "Доступ до" : "Valid until"}</span>
              <strong>{shortDateTime(sub?.ends_at, language)}</strong>
            </article>
            <article className="home-access-item">
              <span>{isRu ? "Контент" : "Content"}</span>
              <strong>{sub?.tariff === "vip" ? "VIP" : sub?.tariff === "premium" ? "Premium" : "Free"}</strong>
            </article>
          </div>
          <div className="cta-row">
            <Link className="btn ghost" to="/profile">
              {isRu ? "Личный кабинет" : "Personal cabinet"}
            </Link>
          </div>
        </section>

        <section className="card home-section">
          <div className="section-head">
            <h3>{isRu ? "Рефералы и бонусы" : "Referrals and bonuses"}</h3>
            <span className="muted">PIT BET</span>
          </div>
          <div className="home-ref-grid">
            <article>
              <span>{isRu ? "Приглашено" : "Invited"}</span>
              <strong>{referral?.invited ?? 0}</strong>
            </article>
            <article>
              <span>{isRu ? "Активировано" : "Activated"}</span>
              <strong>{referral?.activated ?? 0}</strong>
            </article>
            <article>
              <span>{isRu ? "Бонусные дни" : "Bonus days"}</span>
              <strong>{referral?.bonus_days ?? 0}</strong>
            </article>
          </div>
          <div className="cta-row">
            <Link className="btn ghost" to="/menu">
              {isRu ? "Открыть меню" : "Open menu"}
            </Link>
          </div>
        </section>
      </div>

      <section className="card home-section">
        <div className="section-head">
          <h3>{isRu ? "Статистика" : "Stats"}</h3>
          <span className="muted">{isRu ? "Краткий срез" : "Quick summary"}</span>
        </div>
        <div className="home-stats-grid">
          <article>
            <span>{isRu ? "Прогнозов" : "Predictions"}</span>
            <strong>{stats?.total ?? 0}</strong>
          </article>
          <article>
            <span>{isRu ? "Точность" : "Hit rate"}</span>
            <strong>{stats ? `${stats.hit_rate}%` : "0%"}</strong>
          </article>
          <article>
            <span>ROI</span>
            <strong>{stats ? `${stats.roi}%` : "0%"}</strong>
          </article>
          <article>
            <span>{isRu ? "Выигрыши" : "Wins"}</span>
            <strong>{stats?.wins ?? 0}</strong>
          </article>
        </div>
      </section>

      <section className="card home-section">
        <div className="section-head">
          <h3>{isRu ? "Новости PIT BET" : "PIT BET News"}</h3>
          <Link to="/news" className="muted menu-inline-link">
            {isRu ? "Все" : "All"}
          </Link>
        </div>
        {newsPreview.length === 0 ? <p className="empty-state">{isRu ? "Пока без публикаций." : "No posts yet."}</p> : null}
        <div className="home-news-list">
          {newsPreview.map((item) => (
            <article key={item.id} className="home-news-item">
              <div className="home-news-head">
                <strong>{item.title}</strong>
                <span className="badge info">{item.category}</span>
              </div>
              <p>{item.body}</p>
              <div className="home-news-meta">{shortDateTime(item.published_at, language)}</div>
            </article>
          ))}
        </div>
      </section>

      <AppDisclaimer />
    </Layout>
  );
}
