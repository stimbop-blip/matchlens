import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSportLabel } from "../app/sport";
import { countPendingPayments, resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { PremiumRing } from "../components/premium/PremiumRing";
import { RocketLoader, SkeletonBlock, Sparkline } from "../components/ui";
import { api, type MyPayment, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

type TodaySummary = {
  activeSignals: number;
  liveNow: number;
  freeCount: number;
  premiumCount: number;
  vipCount: number;
  settledToday: number;
  source: "realtime" | "fallback";
};

type FeaturedSignal = {
  id: string;
  to: string;
  matchName: string;
  league: string;
  sportType: string;
  signal: string;
  odds: number;
  mode: "live" | "prematch";
  accessLevel: "free" | "premium" | "vip";
  kickoff: string;
  note: string;
};

const HomeHeroScene3D = lazy(() => import("../components/three/HomeScenes").then((module) => ({ default: module.HomeHeroScene3D })));
const HomeSignalScene3D = lazy(() => import("../components/three/HomeScenes").then((module) => ({ default: module.HomeSignalScene3D })));
const HomeSubscriptionScene3D = lazy(() => import("../components/three/HomeScenes").then((module) => ({ default: module.HomeSubscriptionScene3D })));

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function formatDate(value: string | null | undefined, language: "ru" | "en", fallback: string): string {
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

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildTodaySummaryFromPredictions(items: Prediction[]): TodaySummary {
  const today = new Date();
  const summary: TodaySummary = {
    activeSignals: 0,
    liveNow: 0,
    freeCount: 0,
    premiumCount: 0,
    vipCount: 0,
    settledToday: 0,
    source: "realtime",
  };

  items.forEach((item) => {
    if (item.status === "pending") {
      summary.activeSignals += 1;
      if (item.mode === "live") summary.liveNow += 1;
      if (item.access_level === "premium") summary.premiumCount += 1;
      else if (item.access_level === "vip") summary.vipCount += 1;
      else summary.freeCount += 1;
      return;
    }

    const settledAt = new Date(item.event_start_at);
    if (!Number.isNaN(settledAt.getTime()) && isSameDay(settledAt, today)) {
      summary.settledToday += 1;
    }
  });

  return summary;
}

function buildTodaySummaryFallback(stats: PublicStats | null): TodaySummary {
  const pending = stats?.pending ?? 0;
  const wins = stats?.wins ?? 0;
  const loses = stats?.loses ?? 0;
  const refunds = stats?.refunds ?? 0;
  const byAccess = stats?.by_access || {};
  return {
    activeSignals: pending,
    liveNow: 0,
    freeCount: Number(byAccess.free || 0),
    premiumCount: Number(byAccess.premium || 0),
    vipCount: Number(byAccess.vip || 0),
    settledToday: wins + loses + refunds,
    source: "fallback",
  };
}

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string): string {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function statusLabel(status: "active" | "expired" | "canceled" | "inactive" | "unknown", t: (key: string) => string): string {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

function accessNowLabel(tariff: "free" | "premium" | "vip", t: (key: string) => string): string {
  if (tariff === "vip") return t("home.access.openVip");
  if (tariff === "premium") return t("home.access.openPremium");
  return t("home.access.openFree");
}

function buildAccessProgress(tariff: "free" | "premium" | "vip", isActive: boolean): number {
  const base = tariff === "vip" ? 100 : tariff === "premium" ? 68 : 36;
  if (isActive) return base;
  return Math.max(12, base - 22);
}

function buildNewsPreview(body: string, maxLength = 170): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function predictionModeLabel(mode: Prediction["mode"], t: (key: string) => string): string {
  if (mode === "live") return t("common.live");
  return t("common.prematch");
}

function predictionTeaser(value: string | null | undefined, fallback: string): string {
  const source = (value || "").replace(/\s+/g, " ").trim();
  if (!source) return fallback;
  if (source.length <= 150) return source;
  return `${source.slice(0, 147).trim()}...`;
}

function byEventStartAt(left: Prediction, right: Prediction): number {
  const leftDate = new Date(left.event_start_at).getTime();
  const rightDate = new Date(right.event_start_at).getTime();
  const safeLeft = Number.isNaN(leftDate) ? Number.MAX_SAFE_INTEGER : leftDate;
  const safeRight = Number.isNaN(rightDate) ? Number.MAX_SAFE_INTEGER : rightDate;
  return safeLeft - safeRight;
}

function featuredFallbackSignals(language: "ru" | "en"): FeaturedSignal[] {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const inFiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  const fallbackKickoffOne = inTwoHours.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fallbackKickoffTwo = inFiveHours.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (language === "ru") {
    return [
      {
        id: "featured-fallback-1",
        to: "/feed",
        matchName: "Real Madrid - Inter",
        league: "UEFA Champions League",
        sportType: "football",
        signal: "Тотал Больше 2.5",
        odds: 1.88,
        mode: "prematch",
        accessLevel: "premium",
        kickoff: fallbackKickoffOne,
        note: "Линия растет по обеим сторонам, приоритетный прематч сетап.",
      },
      {
        id: "featured-fallback-2",
        to: "/feed",
        matchName: "Sinner - Rublev",
        league: "ATP 500",
        sportType: "tennis",
        signal: "Победа Sinner",
        odds: 1.72,
        mode: "live",
        accessLevel: "vip",
        kickoff: fallbackKickoffTwo,
        note: "Темп розыгрышей и прием подают сильный live сигнал.",
      },
    ];
  }

  return [
    {
      id: "featured-fallback-1",
      to: "/feed",
      matchName: "Real Madrid - Inter",
      league: "UEFA Champions League",
      sportType: "football",
      signal: "Total Over 2.5",
      odds: 1.88,
      mode: "prematch",
      accessLevel: "premium",
      kickoff: fallbackKickoffOne,
      note: "Line pressure builds on both sides, premium pre-match setup.",
    },
    {
      id: "featured-fallback-2",
      to: "/feed",
      matchName: "Sinner - Rublev",
      league: "ATP 500",
      sportType: "tennis",
      signal: "Sinner to win",
      odds: 1.72,
      mode: "live",
      accessLevel: "vip",
      kickoff: fallbackKickoffTwo,
      note: "Rally tempo and return profile indicate a strong live edge.",
    },
  ];
}

function storyIcon(type: "line" | "odds" | "pattern" | "selection") {
  if (type === "line") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18.4h16v1.6H4zm1.2-2.5h2.3V9.2H5.2zm4.1 0h2.3V5.8H9.3zm4.1 0h2.3v-4.1h-2.3zm4.1 0h2.3v-6.6h-2.3z" />
      </svg>
    );
  }
  if (type === "odds") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.3 4.9a2.7 2.7 0 1 0 2.7 2.7 2.7 2.7 0 0 0-2.7-2.7m9.4 9.8a2.7 2.7 0 1 0 2.7 2.7 2.7 2.7 0 0 0-2.7-2.7M6.2 19.4l11.6-14.8 1.6 1.3L7.8 20.7z" />
      </svg>
    );
  }
  if (type === "pattern") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.1h7.1v7H4zm8.9 0H20v4h-7.1zm0 5.8H20v8h-7.1zm-8.9 3H11v5.1H4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 4.8 6.6V12c0 4.1 2.7 6.9 7.2 8.5 4.5-1.6 7.2-4.4 7.2-8.5V6.6zM10.9 14.8l-2.4-2.3 1.4-1.4 1 1 3.2-3.1 1.4 1.4z" />
    </svg>
  );
}

export function HomePage() {
  const { t, language } = useI18n();

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [payments, setPayments] = useState<MyPayment[]>([]);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const [coreLoading, setCoreLoading] = useState(true);
  const [coreError, setCoreError] = useState("");

  useEffect(() => {
    let alive = true;
    setCoreLoading(true);
    setCoreError("");

    Promise.allSettled([api.stats(), api.mySubscription(), api.myReferral(), api.news(), api.myPayments()])
      .then((results) => {
        if (!alive) return;

        const [statsRes, subRes, refRes, newsRes, payRes] = results;
        setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
        setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
        setReferral(refRes.status === "fulfilled" ? refRes.value : null);
        setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
        setPayments(payRes.status === "fulfilled" ? payRes.value : []);

        if (results.every((entry) => entry.status === "rejected")) {
          setCoreError(t("common.retry"));
        }
      })
      .finally(() => {
        if (!alive) return;
        setCoreLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [refreshTick, t]);

  useEffect(() => {
    let alive = true;
    setSummaryLoading(true);
    setSummaryError("");

    api
      .predictions({ limit: 100 })
      .then((list) => {
        if (!alive) return;
        setPredictions(list);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setPredictions([]);
        setSummaryError(parseErrorMessage(error, ""));
      })
      .finally(() => {
        if (!alive) return;
        setSummaryLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setRefreshTick((prev) => prev + 1);
      }
    }, 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRefreshTick((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subscriptionRaw);
  const pendingPayments = countPendingPayments(payments);
  const today = useMemo(() => {
    if (predictions.length > 0) return buildTodaySummaryFromPredictions(predictions);
    return buildTodaySummaryFallback(stats);
  }, [predictions, stats]);

  const previewNews = useMemo(() => news.filter((item) => item.is_published).slice(0, 3), [news]);

  const featuredSignals = useMemo<FeaturedSignal[]>(() => {
    const sorted = [...predictions].sort(byEventStartAt);
    const pending = sorted.filter((item) => item.status === "pending");
    const source = pending.length >= 2 ? pending : sorted;

    const selected = source.slice(0, 2).map((item) => ({
      id: item.id,
      to: `/feed/${item.id}`,
      matchName: item.match_name,
      league: item.league || t("feed.noLeague"),
      sportType: item.sport_type,
      signal: item.signal_type,
      odds: item.odds,
      mode: item.mode,
      accessLevel: item.access_level,
      kickoff: formatDate(item.event_start_at, language, t("common.noDate")),
      note: predictionTeaser(item.short_description, t("feed.teaserFallback")),
    }));

    if (selected.length >= 2) return selected;

    const fallback = featuredFallbackSignals(language);
    return [...selected, ...fallback.slice(selected.length, 2)];
  }, [language, predictions, t]);

  const pulseValues = useMemo(() => {
    const roi = stats?.roi ?? 0;
    const pending = stats?.pending ?? 0;
    return [52, 55, 58, 56, 60, 63, 61, 66, 68, 71].map((value, idx) => value + Math.round(roi / 11) + (pending > 0 ? idx % 2 : 0));
  }, [stats?.roi, stats?.pending]);

  const performanceWave = useMemo(() => {
    const total = Math.max(1, stats?.total ?? 1);
    const wins = stats?.wins ?? 0;
    const loses = stats?.loses ?? 0;
    const refunds = stats?.refunds ?? 0;
    const pending = stats?.pending ?? 0;
    const parts = [wins, loses, refunds, pending];
    let progress = 0;
    return parts.map((part) => {
      progress += part;
      return Math.round((progress / total) * 100);
    });
  }, [stats]);

  const accessProgress = buildAccessProgress(sub.tariff, sub.is_active);
  const statusText = statusLabel(sub.status, t);
  const roiText = `${(stats?.roi ?? 0).toFixed(1)}%`;
  const hitRateText = `${(stats?.hit_rate ?? 0).toFixed(1)}%`;

  return (
    <Layout>
      <HeroPanel
        eyebrow="PIT BET Private Club"
        title="Private Sports Intelligence"
        subtitle={t("home.hero.subheadline")}
        right={<span className={`pb-tier-pill ${sub.tariff}`}>{tariffLabel(sub.tariff, t)}</span>}
      >
        <div className="pb-overview-hero-3d">
          <div className="pb-overview-trophy-3d" aria-hidden="true">
            <Suspense fallback={<div className="pb-home3d-canvas-fallback" />}>
              <HomeHeroScene3D />
            </Suspense>
          </div>
          <div className="pb-overview-hero-stats">
            <article>
              <small>{t("common.roi")}</small>
              <strong>{roiText}</strong>
            </article>
            <article>
              <small>{t("home.performance.hit")}</small>
              <strong>{hitRateText}</strong>
            </article>
            <article>
              <small>{t("home.today.active")}</small>
              <strong>{today.activeSignals}</strong>
            </article>
          </div>
        </div>

        <div className="pb-overview-market-shell">
          <div className="pb-overview-market-head">
            <span>{t("home.hero.marketPulse")}</span>
            <span className="pb-overview-live-tag">{t("home.hero.marketTag")}</span>
          </div>
          <Sparkline values={pulseValues} className="pb-overview-sparkline" />
        </div>

        <div className="pb-overview-hero-actions">
          <Link className="pb-btn pb-btn-primary" to="/feed">
            {t("home.hero.ctaSignals")}
          </Link>
          <Link className="pb-btn pb-btn-secondary" to="/tariffs">
            {t("layout.main.openTariffs")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/menu">
            {t("layout.main.openHub")}
          </Link>
        </div>
      </HeroPanel>

      <section className="pb-premium-panel pb-overview-featured pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.hero.ctaSignals")}</h3>
          <small>{t("feed.hero.subtitle")}</small>
        </div>

        {summaryLoading ? (
          <div className="pb-home3d-featured-skeleton" aria-hidden="true">
            <SkeletonBlock className="h-84" />
            <SkeletonBlock className="h-84" />
          </div>
        ) : null}

        {!summaryLoading && featuredSignals.length === 0 ? <p className="pb-empty-state">{summaryError || t("feed.empty")}</p> : null}

        {!summaryLoading && featuredSignals.length > 0 ? (
          <div className="pb-home3d-featured-grid">
            {featuredSignals.map((item, index) => (
              <Link key={item.id} className={`pb-home3d-match-card ${index === 0 ? "left" : "right"}`} to={item.to}>
                <div className="pb-home3d-match-head">
                  <span>{resolveSportLabel(item.sportType, language)}</span>
                  <span className={`pb-home3d-match-mode ${item.mode}`}>{predictionModeLabel(item.mode, t)}</span>
                </div>

                <h4>{item.matchName}</h4>
                <p>{item.league}</p>

                <div className="pb-home3d-match-scene" aria-hidden="true">
                  <Suspense fallback={<div className="pb-home3d-canvas-fallback" />}>
                    <HomeSignalScene3D sport={item.sportType} />
                  </Suspense>
                </div>

                <div className="pb-home3d-match-kpi">
                  <span>
                    {t("feed.label.odds")}: <b>{item.odds.toFixed(2)}</b>
                  </span>
                  <span>{tariffLabel(item.accessLevel, t)}</span>
                  <span>{item.kickoff}</span>
                </div>

                <small>{item.signal}</small>
                <small>{item.note}</small>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="pb-premium-panel pb-overview-news pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.news.title")}</h3>
          <small>{t("home.news.subtitle")}</small>
        </div>

        {coreLoading ? (
          <div className="pb-overview-news-skeleton" aria-hidden="true">
            <SkeletonBlock className="h-72" />
            <SkeletonBlock className="h-72" />
            <SkeletonBlock className="h-72" />
          </div>
        ) : null}

        {!coreLoading && previewNews.length === 0 ? <p className="pb-empty-state">{coreError || t("home.news.empty")}</p> : null}

        {!coreLoading && previewNews.length > 0 ? (
          <div className="pb-overview-news-list">
            {previewNews.map((item) => (
              <Link key={item.id} className="pb-overview-news-item" to={`/news/${item.id}`}>
                <h4>{item.title}</h4>
                <p>{buildNewsPreview(item.body, 140)}</p>
                <small>{formatDate(item.published_at, language, t("common.noDate"))}</small>
              </Link>
            ))}
          </div>
        ) : null}

        <Link className="pb-btn pb-btn-secondary" to="/news">
          {t("home.news.openAll")}
        </Link>
      </section>

      <section className="pb-premium-panel pb-overview-access pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.access.title")}</h3>
          <small>{t("home.access.subtitle")}</small>
        </div>

        <div className="pb-overview-access-grid">
          <div className="pb-home3d-access-visual">
            <div className="pb-home3d-access-scene" aria-hidden="true">
              <Suspense fallback={<div className="pb-home3d-canvas-fallback" />}>
                <HomeSubscriptionScene3D percent={accessProgress} />
              </Suspense>
            </div>
            <PremiumRing value={accessProgress} label={t("home.access.openNow")} caption={accessNowLabel(sub.tariff, t)} tone={sub.tariff === "vip" ? "vip" : "accent"} />
          </div>

          <div className="pb-overview-access-metrics">
            <PremiumKpi label={t("home.access.tariff")} value={tariffLabel(sub.tariff, t)} tone={sub.tariff === "vip" ? "vip" : "accent"} />
            <PremiumKpi label={t("home.access.status")} value={statusText} tone={sub.is_active ? "success" : "warning"} />
            <PremiumKpi label={t("home.access.until")} value={formatDate(sub.ends_at, language, "-")} />
            <PremiumKpi label={t("home.access.pending")} value={pendingPayments} hint={t("home.hero.pendingPayments")} />
          </div>
        </div>
      </section>

      <section className="pb-premium-panel pb-overview-kpi pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.today.title")}</h3>
          <small>{t("home.today.subtitle")}</small>
        </div>

        {summaryLoading ? (
          <>
            <RocketLoader title={t("home.loadingTitle")} subtitle={t("home.loadingSubtitle")} compact />
            <div className="pb-overview-kpi-skeleton" aria-hidden="true">
              <SkeletonBlock className="h-96" />
              <SkeletonBlock className="h-84" />
              <SkeletonBlock className="h-84" />
            </div>
          </>
        ) : null}

        {!summaryLoading && summaryError ? (
          <div className="pb-error-state">
            <p>{summaryError || t("home.today.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setRefreshTick((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        ) : null}

        {!summaryLoading && !summaryError ? (
          <>
            <div className="pb-overview-kpi-grid">
              <PremiumKpi label={t("home.today.active")} value={today.activeSignals} tone="accent" emphasized />
              <PremiumKpi label={t("home.today.liveNow")} value={today.liveNow} hint={t("common.live")} />
              <PremiumKpi label={t("home.today.free")} value={today.freeCount} />
              <PremiumKpi label={t("home.today.premium")} value={today.premiumCount} tone="accent" />
              <PremiumKpi label={t("home.today.vip")} value={today.vipCount} tone="vip" />
              <PremiumKpi label={t("home.today.settled")} value={today.settledToday} />
            </div>
            <p className="pb-overview-kpi-source">{today.source === "realtime" ? t("home.today.dataRealtime") : t("home.today.dataFallback")}</p>
          </>
        ) : null}
      </section>

      <section className="pb-premium-panel pb-overview-story pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.story.title")}</h3>
          <small>{t("home.story.subtitle")}</small>
        </div>

        <div className="pb-overview-story-grid pb-overview-signal3d-grid">
          <article className="pb-overview-signal3d-card">
            <span className="pb-overview-story-icon">{storyIcon("line")}</span>
            <strong>{t("home.story.p1.title")}</strong>
            <p>{t("home.story.p1.text")}</p>
            <div className="pb-overview-signal3d-kpi">
              <span>{t("home.today.active")}</span>
              <b>{today.activeSignals}</b>
            </div>
          </article>
          <article className="pb-overview-signal3d-card">
            <span className="pb-overview-story-icon">{storyIcon("odds")}</span>
            <strong>{t("home.story.p2.title")}</strong>
            <p>{t("home.story.p2.text")}</p>
            <div className="pb-overview-signal3d-kpi">
              <span>{t("home.today.premium")}</span>
              <b>{today.premiumCount + today.vipCount}</b>
            </div>
          </article>
          <article className="pb-overview-signal3d-card">
            <span className="pb-overview-story-icon">{storyIcon("pattern")}</span>
            <strong>{t("home.story.p3.title")}</strong>
            <p>{t("home.story.p3.text")}</p>
            <div className="pb-overview-signal3d-kpi">
              <span>{t("home.performance.hit")}</span>
              <b>{hitRateText}</b>
            </div>
          </article>
        </div>
      </section>

      <section className="pb-premium-panel pb-overview-performance pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.performance.title")}</h3>
          <small>{t("home.performance.subtitle")}</small>
        </div>

        <div className="pb-overview-performance-grid">
          <PremiumKpi label={t("common.roi")} value={roiText} tone="accent" />
          <PremiumKpi label={t("home.performance.hit")} value={hitRateText} tone="success" />
          <PremiumKpi label={t("home.performance.total")} value={stats?.total ?? 0} />
          <PremiumKpi label={t("home.performance.ratio")} value={`${stats?.wins ?? 0}/${stats?.loses ?? 0}/${stats?.refunds ?? 0}`} />
        </div>

        <Sparkline values={performanceWave} className="pb-overview-performance-wave" />
      </section>

      <section className="pb-premium-panel pb-overview-referral pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("home.ref.title")}</h3>
          <small>{t("home.ref.subtitle")}</small>
        </div>

        <div className="pb-overview-referral-grid">
          <PremiumKpi label={t("home.ref.invited")} value={referral?.invited ?? 0} />
          <PremiumKpi label={t("home.ref.activated")} value={referral?.activated ?? 0} tone="accent" />
          <PremiumKpi label={t("home.ref.bonus")} value={`${referral?.bonus_days ?? 0} ${t("common.daysShort")}`} tone="success" />
        </div>

        <Link className="pb-btn pb-btn-ghost" to="/profile#referral">
          {t("home.ref.action")}
        </Link>
      </section>

      <AppDisclaimer />
    </Layout>
  );
}
