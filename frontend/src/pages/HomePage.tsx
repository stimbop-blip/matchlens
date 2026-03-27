import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, NewsPreviewCard, SectionActions, SectionHeader, StatCard } from "../components/ui";
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
  if (value === "active") return language === "ru" ? "Активен" : "Active";
  if (value === "expired") return language === "ru" ? "Истек" : "Expired";
  if (value === "canceled") return language === "ru" ? "Отменен" : "Canceled";
  return language === "ru" ? "Не активен" : "Inactive";
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

function isSameDay(date: Date, other: Date) {
  return date.getFullYear() === other.getFullYear() && date.getMonth() === other.getMonth() && date.getDate() === other.getDate();
}

export function HomePage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.me(),
      api.stats(),
      api.mySubscription(),
      api.news(),
      api.myReferral(),
      api.predictions({ limit: 140 }),
    ])
      .then(([meData, statsData, subData, newsData, referralData, predictionData]) => {
        if (!alive) return;
        setMe(meData);
        setStats(statsData);
        setSub({ tariff: subData.tariff, status: subData.status, ends_at: subData.ends_at });
        setNews(newsData);
        setReferral(referralData);
        setPredictions(predictionData);
      })
      .catch(() => {
        if (!alive) return;
        setMe(null);
        setStats(null);
        setSub(null);
        setNews([]);
        setReferral(null);
        setPredictions([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  const pending = predictions.filter((item) => item.status === "pending");
  const pendingFree = pending.filter((item) => item.access_level === "free").length;
  const pendingPremium = pending.filter((item) => item.access_level === "premium").length;
  const pendingVip = pending.filter((item) => item.access_level === "vip").length;
  const liveCount = pending.filter((item) => item.mode === "live").length;
  const prematchCount = pending.filter((item) => item.mode === "prematch").length;

  const closedToday = useMemo(() => {
    const now = new Date();
    return predictions.filter((item) => {
      if (item.status === "pending") return false;
      const source = item.published_at ? new Date(item.published_at) : new Date(item.event_start_at);
      if (Number.isNaN(source.getTime())) return false;
      return isSameDay(source, now);
    }).length;
  }, [predictions]);

  const previewNews = news.slice(0, 3);
  const displayName = me?.first_name || (me?.username ? `@${me.username}` : isRu ? "Пользователь PIT BET" : "PIT BET user");

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={isRu ? "Сильные сигналы. Понятная статистика. Контроль доступа." : "Strong signals. Clear stats. Full access control."}
        description={
          isRu
            ? "PIT BET отслеживает движение линии, коэффициенты и игровые паттерны, чтобы выделять самые сильные игровые ситуации."
            : "PIT BET tracks line movement, odds, and game patterns to surface the strongest game situations."
        }
        right={<AccessBadge level={tariffCode(sub?.tariff)} label={tariffLabel(sub?.tariff)} />}
      >
        <div className="hero-mini-info">
          <span>{isRu ? "Тариф" : "Tariff"}: <b>{tariffLabel(sub?.tariff)}</b></span>
          <span>{isRu ? "Статус" : "Status"}: <b>{statusLabel(sub?.status, language)}</b></span>
        </div>
        <SectionActions>
          <Link className="btn" to="/feed">{isRu ? "Открыть ленту" : "Open feed"}</Link>
          <Link className="btn secondary" to="/tariffs">{isRu ? "Смотреть тарифы" : "View tariffs"}</Link>
        </SectionActions>
      </HeroCard>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Главное сегодня" : "Main focus today"}
          subtitle={isRu ? "Живой срез активности по сигналам" : "Live snapshot of signal activity"}
        />
        <div className="today-grid">
          <article className="today-primary-card">
            <small>{isRu ? "Активных сигналов" : "Active signals"}</small>
            <strong>{pending.length}</strong>
            <p>{isRu ? "Сейчас в работе" : "Currently in play"}</p>
          </article>
          <div className="today-secondary-grid">
            <StatCard label="Free" value={pendingFree} />
            <StatCard label="Premium" value={pendingPremium} tone="accent" />
            <StatCard label="VIP" value={pendingVip} tone="warning" />
          </div>
        </div>
        <div className="today-inline-metrics">
          <span>{isRu ? "Live" : "Live"}: <b>{liveCount}</b></span>
          <span>{isRu ? "Prematch" : "Prematch"}: <b>{prematchCount}</b></span>
          <span>{isRu ? "Закрыто сегодня" : "Closed today"}: <b>{closedToday}</b></span>
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={isRu ? "Преимущества" : "Core advantages"} />
        <div className="advantage-grid">
          <article className="feature-card strong wide">
            <h3>{isRu ? "Рыночные сигналы" : "Market signals"}</h3>
            <p>{isRu ? "Отбор по движению линии и коэффициентам с учетом контекста матча." : "Selection by line movement and odds with game context."}</p>
          </article>
          <article className="feature-card">
            <h3>{isRu ? "Прозрачная статистика" : "Transparent statistics"}</h3>
            <p>{isRu ? "ROI, hit rate и реальная структура результатов без шума." : "ROI, hit rate, and real outcome structure without noise."}</p>
          </article>
          <article className="feature-card accent">
            <h3>{isRu ? "Доступ по уровням" : "Tiered access"}</h3>
            <p>{isRu ? "Free, Premium и VIP под разную глубину и скорость работы." : "Free, Premium, and VIP for different depth and speed."}</p>
          </article>
        </div>
      </AppShellSection>

      <div className="split-grid">
        <AppShellSection>
          <SectionHeader title={isRu ? "Твой доступ" : "Your access"} />
          <div className="stack-list compact">
            <div className="info-row"><span>{isRu ? "Пользователь" : "User"}</span><strong>{displayName}</strong></div>
            <div className="info-row"><span>{isRu ? "Тариф" : "Tariff"}</span><strong>{tariffLabel(sub?.tariff)}</strong></div>
            <div className="info-row"><span>{isRu ? "Статус" : "Status"}</span><strong>{statusLabel(sub?.status, language)}</strong></div>
            <div className="info-row"><span>{isRu ? "Доступ до" : "Valid until"}</span><strong>{dateLabel(sub?.ends_at, language)}</strong></div>
          </div>
          <SectionActions compact>
            <Link className="btn secondary" to="/profile">{isRu ? "Управлять доступом" : "Manage access"}</Link>
          </SectionActions>
        </AppShellSection>

        <AppShellSection>
          <SectionHeader title={isRu ? "Статистика" : "Statistics"} subtitle={isRu ? "Короткий teaser" : "Compact teaser"} />
          <div className="stat-grid compact">
            <StatCard label={isRu ? "Прогнозов" : "Predictions"} value={stats?.total ?? 0} />
            <StatCard label={isRu ? "Точность" : "Hit rate"} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
            <StatCard label="ROI" value={`${stats?.roi ?? 0}%`} tone="accent" />
            <StatCard label="W/L/R" value={`${stats?.wins ?? 0}/${stats?.loses ?? 0}/${stats?.refunds ?? 0}`} />
          </div>
          <SectionActions compact>
            <Link className="btn ghost" to="/stats">{isRu ? "Открыть статистику" : "Open stats"}</Link>
          </SectionActions>
        </AppShellSection>
      </div>

      <AppShellSection>
        <SectionHeader title={isRu ? "Новости PIT BET" : "PIT BET News"} action={<Link className="text-link" to="/news">{isRu ? "Все новости" : "All news"}</Link>} />
        {previewNews.length === 0 ? (
          <div className="empty-block subtle">
            <p className="empty-state">{isRu ? "Новых публикаций пока нет." : "No fresh publications yet."}</p>
          </div>
        ) : (
          <div className="news-list compact">
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
        )}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={isRu ? "Рефералы и бонусы" : "Referrals and bonuses"} />
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Приглашено" : "Invited"} value={referral?.invited ?? 0} />
          <StatCard label={isRu ? "Активировано" : "Activated"} value={referral?.activated ?? 0} />
          <StatCard label={isRu ? "Бонусные дни" : "Bonus days"} value={referral?.bonus_days ?? 0} tone="accent" />
        </div>
        <p className="muted-line">
          {isRu
            ? "Приглашай друзей и продлевай доступ бонусными днями после их активации."
            : "Invite friends and extend your access with bonus days after activation."}
        </p>
        <SectionActions compact>
          <Link className="btn ghost" to="/profile#referral">
            {isRu ? "Открыть реферальную программу" : "Open referral program"}
          </Link>
        </SectionActions>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
