import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  AccessBadge,
  AppShellSection,
  HeroCard,
  NewsPreviewCard,
  SectionHeader,
  StatCard,
} from "../components/ui";
import { api, type Me, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

function tariffCode(value: string | null | undefined): "free" | "premium" | "vip" {
  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  return "free";
}

function tariffLabel(value: string | null | undefined): string {
  if (value === "premium") return "Premium";
  if (value === "vip") return "VIP";
  return "Free";
}

function statusLabel(value: string | null | undefined, language: "ru" | "en") {
  if (value === "active") return language === "ru" ? "Активна" : "Active";
  if (value === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (value === "canceled") return language === "ru" ? "Отменена" : "Canceled";
  return language === "ru" ? "Не активна" : "Inactive";
}

function dateLabel(value: string | null | undefined, language: "ru" | "en") {
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

export function HomePage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [pendingSignals, setPendingSignals] = useState<Prediction[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.me(),
      api.stats(),
      api.mySubscription(),
      api.news(),
      api.myReferral(),
      api.predictions({ status: "pending", limit: 120 }),
    ])
      .then(([meData, statsData, subData, newsData, referralData, pendingData]) => {
        if (!alive) return;
        setMe(meData);
        setStats(statsData);
        setSub({ tariff: subData.tariff, status: subData.status, ends_at: subData.ends_at });
        setNews(newsData);
        setReferral(referralData);
        setPendingSignals(pendingData);
      })
      .catch(() => {
        if (!alive) return;
        setMe(null);
        setStats(null);
        setSub(null);
        setNews([]);
        setReferral(null);
        setPendingSignals([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  const pendingFree = pendingSignals.filter((item) => item.access_level === "free").length;
  const pendingPremium = pendingSignals.filter((item) => item.access_level === "premium").length;
  const pendingVip = pendingSignals.filter((item) => item.access_level === "vip").length;
  const previewNews = news.slice(0, 3);

  const displayName = me?.first_name || (me?.username ? `@${me.username}` : isRu ? "Пользователь PIT BET" : "PIT BET user");
  const accessStatus = statusLabel(sub?.status, language);

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={isRu ? "Сигналы и аналитика каждый день" : "Signals and analytics every day"}
        description={
          isRu
            ? "PIT BET отслеживает движение линии, коэффициенты, рыночные сигналы и игровые паттерны, чтобы выделять сильные игровые ситуации."
            : "PIT BET tracks line movement, odds, market signals, and game patterns to highlight strong market opportunities."
        }
        right={<AccessBadge level={tariffCode(sub?.tariff)} label={tariffLabel(sub?.tariff)} />}
      >
        <div className="hero-mini-info">
          <span>{isRu ? "Профиль" : "Profile"}: <b>{displayName}</b></span>
          <span>{isRu ? "Статус" : "Status"}: <b>{accessStatus}</b></span>
        </div>
        <div className="cta-row">
          <Link className="btn" to="/feed">
            {isRu ? "Открыть ленту" : "Open feed"}
          </Link>
          <Link className="btn secondary" to="/tariffs">
            {isRu ? "Тарифы" : "Tariffs"}
          </Link>
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Главное сегодня" : "Today at a glance"}
          subtitle={isRu ? "Активность по сигналам и доступу" : "Signal activity and access overview"}
          action={<span className="hint-chip">PIT BET</span>}
        />
        <div className="stat-grid">
          <StatCard label={isRu ? "Активных сигналов" : "Active signals"} value={pendingSignals.length} tone="accent" />
          <StatCard label="Free" value={pendingFree} />
          <StatCard label="Premium" value={pendingPremium} />
          <StatCard label="VIP" value={pendingVip} tone="warning" />
        </div>
        <div className="quick-links">
          <Link to="/feed" className="quick-link">{isRu ? "Лента" : "Feed"}</Link>
          <Link to="/stats" className="quick-link">{isRu ? "Статистика" : "Stats"}</Link>
          <Link to="/tariffs" className="quick-link">{isRu ? "Тарифы" : "Tariffs"}</Link>
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={isRu ? "Преимущества" : "Why PIT BET"} />
        <div className="feature-grid">
          <article className="feature-card strong">
            <h3>{isRu ? "Рыночные сигналы" : "Market signals"}</h3>
            <p>{isRu ? "Отбор по движению линии, коэффициентам и игровому контексту." : "Selection by line movement, odds, and game context."}</p>
          </article>
          <article className="feature-card">
            <h3>{isRu ? "Прозрачная статистика" : "Transparent statistics"}</h3>
            <p>{isRu ? "Прозрачные показатели hit rate, ROI и результатов." : "Transparent hit rate, ROI, and outcome metrics."}</p>
          </article>
          <article className="feature-card">
            <h3>{isRu ? "Уведомления" : "Notifications"}</h3>
            <p>{isRu ? "Гибкие настройки push-уведомлений по категориям." : "Flexible push notification settings by category."}</p>
          </article>
          <article className="feature-card accent">
            <h3>{isRu ? "Premium / VIP доступ" : "Premium / VIP access"}</h3>
            <p>{isRu ? "Режимы доступа под разную интенсивность и скорость принятия решений." : "Access levels for different intensity and speed of execution."}</p>
          </article>
        </div>
      </AppShellSection>

      <div className="split-grid">
        <AppShellSection>
          <SectionHeader title={isRu ? "Твой доступ" : "Your access"} />
          <div className="stack-list">
            <div className="info-row">
              <span>{isRu ? "Пользователь" : "User"}</span>
              <strong>{displayName}</strong>
            </div>
            <div className="info-row">
              <span>{isRu ? "Тариф" : "Tariff"}</span>
              <strong>{tariffLabel(sub?.tariff)}</strong>
            </div>
            <div className="info-row">
              <span>{isRu ? "Статус" : "Status"}</span>
              <strong>{statusLabel(sub?.status, language)}</strong>
            </div>
            <div className="info-row">
              <span>{isRu ? "Доступ до" : "Valid until"}</span>
              <strong>{dateLabel(sub?.ends_at, language)}</strong>
            </div>
          </div>
          <div className="cta-row">
            <Link className="btn secondary" to="/profile">
              {isRu ? "В профиль" : "Open profile"}
            </Link>
            <Link className="btn ghost" to="/tariffs">
              {isRu ? "К тарифам" : "Tariffs"}
            </Link>
          </div>
        </AppShellSection>

        <AppShellSection>
          <SectionHeader title={isRu ? "Статистика" : "Statistics"} />
          <div className="stat-grid compact">
            <StatCard label={isRu ? "Прогнозов" : "Predictions"} value={stats?.total ?? 0} />
            <StatCard label={isRu ? "Точность" : "Hit rate"} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
            <StatCard label="ROI" value={`${stats?.roi ?? 0}%`} tone="accent" />
            <StatCard label={isRu ? "Выигрыши / Поражения / Возвраты" : "Wins / Loses / Refunds"} value={`${stats?.wins ?? 0} / ${stats?.loses ?? 0} / ${stats?.refunds ?? 0}`} />
          </div>
          <Link className="btn ghost" to="/stats">
            {isRu ? "Открыть статистику" : "Open stats"}
          </Link>
        </AppShellSection>
      </div>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Новости PIT BET" : "PIT BET News"}
          action={<Link className="text-link" to="/news">{isRu ? "Все" : "All"}</Link>}
        />
        {previewNews.length === 0 ? <p className="empty-state">{isRu ? "Пока без публикаций." : "No posts yet."}</p> : null}
        <div className="news-list">
          {previewNews.map((item) => (
            <NewsPreviewCard
              key={item.id}
              title={item.title}
              body={item.body}
              category={item.category}
              meta={dateLabel(item.published_at, language)}
              to={`/news/${item.id}`}
              cta={isRu ? "Открыть" : "Open"}
            />
          ))}
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={isRu ? "Рефералы и бонусы" : "Referrals and bonuses"} />
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Приглашено" : "Invited"} value={referral?.invited ?? 0} />
          <StatCard label={isRu ? "Активировано" : "Activated"} value={referral?.activated ?? 0} />
          <StatCard label={isRu ? "Бонусные дни" : "Bonus days"} value={referral?.bonus_days ?? 0} tone="accent" />
        </div>
        <Link className="btn ghost" to="/profile#referral">
          {isRu ? "Управлять в профиле" : "Manage in profile"}
        </Link>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
