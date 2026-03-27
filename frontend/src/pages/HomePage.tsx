import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, NewsPreviewCard, SectionActions, SectionHeader, Sparkline, StatCard } from "../components/ui";
import { api, type Me, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

function formatDate(value: string | null | undefined, language: "ru" | "en", fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
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

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string) {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function statusLabel(status: "active" | "expired" | "canceled" | "inactive" | "unknown", t: (key: string) => string) {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

export function HomePage() {
  const { t, language } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [subRaw, setSubRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const results = await Promise.allSettled([
        api.me(),
        api.stats(),
        api.mySubscription(),
        api.news(),
        api.myReferral(),
        api.predictions({ limit: 140 }),
      ]);
      if (!alive) return;

      const [meRes, statsRes, subRes, newsRes, referralRes, predictionRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setSubRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
      setReferral(referralRes.status === "fulfilled" ? referralRes.value : null);
      setPredictions(predictionRes.status === "fulfilled" ? predictionRes.value : []);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subRaw);

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
  const displayName = me?.first_name || (me?.username ? `@${me.username}` : "PIT BET");

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={t("home.hero.title")}
        description={t("home.hero.subtitle")}
        right={<AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />}
      >
        <div className="market-ribbon">
          <span>{t("home.hero.market")}</span>
          <Sparkline values={[72, 66, 69, 58, 61, 44, 48, 32, 38, 27]} />
          <span className="live-pulse">{t("home.hero.live")}</span>
        </div>
        <div className="hero-mini-info">
          <span>{t("home.hero.tariff")}: <b>{tariffLabel(sub.tariff, t)}</b></span>
          <span>{t("home.hero.status")}: <b>{statusLabel(sub.status, t)}</b></span>
          <span>{t("home.hero.until")}: <b>{formatDate(sub.ends_at, language, "—")}</b></span>
        </div>
        <SectionActions>
          <Link className="btn" to="/feed">{t("home.hero.openSignals")}</Link>
          <Link className="btn secondary" to="/tariffs">{t("home.hero.openTariffs")}</Link>
        </SectionActions>
      </HeroCard>

      <AppShellSection>
        <SectionHeader title={t("home.snapshot.title")} subtitle={t("home.snapshot.subtitle")} />
        <div className="today-grid">
          <article className="today-primary-card">
            <small>{t("home.snapshot.active")}</small>
            <strong>{pending.length}</strong>
            <p>{t("home.snapshot.inPlay")}</p>
          </article>
          <div className="today-secondary-grid">
            <StatCard label={t("common.free")} value={pendingFree} />
            <StatCard label={t("common.premium")} value={pendingPremium} tone="accent" />
            <StatCard label={t("common.vip")} value={pendingVip} tone="warning" />
          </div>
        </div>
        <div className="today-inline-metrics">
          <span>{t("common.live")}: <b>{liveCount}</b></span>
          <span>{t("common.prematch")}: <b>{prematchCount}</b></span>
          <span>{t("home.snapshot.settled")}: <b>{closedToday}</b></span>
        </div>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("home.why.title")} />
        <div className="advantage-grid">
          <article className="feature-card strong wide">
            <h3>{t("home.why.market.title")}</h3>
            <p>{t("home.why.market.desc")}</p>
          </article>
          <article className="feature-card">
            <h3>{t("home.why.stats.title")}</h3>
            <p>{t("home.why.stats.desc")}</p>
          </article>
          <article className="feature-card accent">
            <h3>{t("home.why.access.title")}</h3>
            <p>{t("home.why.access.desc")}</p>
          </article>
        </div>
      </AppShellSection>

      <div className="split-grid">
        <AppShellSection>
          <SectionHeader title={t("home.access.title")} />
          <div className="stack-list compact">
            <div className="info-row"><span>{t("home.access.user")}</span><strong>{displayName}</strong></div>
            <div className="info-row"><span>{t("home.access.tariff")}</span><strong>{tariffLabel(sub.tariff, t)}</strong></div>
            <div className="info-row"><span>{t("home.access.status")}</span><strong>{statusLabel(sub.status, t)}</strong></div>
            <div className="info-row"><span>{t("home.access.until")}</span><strong>{formatDate(sub.ends_at, language, "—")}</strong></div>
          </div>
          <SectionActions compact>
            <Link className="btn secondary" to="/profile">{t("home.access.action")}</Link>
          </SectionActions>
        </AppShellSection>

        <AppShellSection>
          <SectionHeader title={t("home.performance.title")} subtitle={t("home.performance.subtitle")} />
          <div className="stat-grid compact">
            <StatCard label={t("home.performance.total")} value={stats?.total ?? 0} />
            <StatCard label={t("home.performance.hit")} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
            <StatCard label={t("common.roi")} value={`${stats?.roi ?? 0}%`} tone="accent" />
            <StatCard label={t("home.performance.ratio")} value={`${stats?.wins ?? 0}/${stats?.loses ?? 0}/${stats?.refunds ?? 0}`} />
          </div>
          <SectionActions compact>
            <Link className="btn ghost" to="/stats">{t("home.performance.action")}</Link>
          </SectionActions>
        </AppShellSection>
      </div>

      <AppShellSection>
        <SectionHeader title={t("home.news.title")} action={<Link className="text-link" to="/news">{t("home.news.all")}</Link>} />
        {previewNews.length === 0 ? (
          <div className="empty-block subtle">
            <p className="empty-state">{t("home.news.empty")}</p>
          </div>
        ) : (
          <div className="news-list compact">
            {previewNews.map((item) => (
              <NewsPreviewCard
                key={item.id}
                title={item.title}
                body={item.body}
                category={item.category}
                meta={formatDate(item.published_at, language, t("common.noDate"))}
                to={`/news/${item.id}`}
                cta={t("home.news.open")}
              />
            ))}
          </div>
        )}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("home.ref.title")} />
        <div className="stat-grid compact">
          <StatCard label={t("profile.ref.invited")} value={referral?.invited ?? 0} />
          <StatCard label={t("profile.ref.activated")} value={referral?.activated ?? 0} />
          <StatCard label={t("profile.ref.bonus")} value={referral?.bonus_days ?? 0} tone="accent" />
        </div>
        <p className="muted-line">{t("home.ref.text")}</p>
        <SectionActions compact>
          <Link className="btn ghost" to="/profile#referral">{t("home.ref.action")}</Link>
        </SectionActions>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
