import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { countPendingPayments, resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  AccessBadge,
  ActivityBand,
  AnimatedNumber,
  AppShellSection,
  CTACluster,
  MarketPulse,
  RocketLoader,
  SectionHeader,
  SkeletonBlock,
  Sparkline,
} from "../components/ui";
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

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

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

function isSameDay(a: Date, b: Date) {
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
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
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

  const [loading, setLoading] = useState(true);
  const didLoadCoreRef = useRef(false);
  const didLoadSummaryRef = useRef(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!didLoadCoreRef.current) setLoading(true);
      const results = await Promise.allSettled([api.stats(), api.mySubscription(), api.myReferral(), api.news(), api.myPayments()]);
      if (!alive) return;

      const [statsRes, subRes, refRes, newsRes, payRes] = results;
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
      setPayments(payRes.status === "fulfilled" ? payRes.value : []);
      setLoading(false);
      didLoadCoreRef.current = true;
    };

    void load();
    return () => {
      alive = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    let alive = true;
    if (!didLoadSummaryRef.current) setSummaryLoading(true);
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
        didLoadSummaryRef.current = true;
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

  const previewNews = news.slice(0, 3);
  const pulseValues = useMemo(() => {
    const roi = stats?.roi ?? 0;
    const pending = stats?.pending ?? 0;
    return [54, 57, 59, 56, 60, 63, 61, 65, 68, 70].map((value, idx) => value + Math.round(roi / 12) + (pending > 0 ? idx % 3 : 0));
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
  const accessRingStyle = {
    background: `conic-gradient(var(--accent-primary) ${accessProgress}%, color-mix(in srgb, var(--surface-1) 82%, transparent) ${accessProgress}% 100%)`,
  };

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-brand-chip large">PIT BET</span>
          <AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />
        </div>

        <h2>{t("home.hero.headline")}</h2>
        <p>{t("home.hero.subheadline")}</p>

        <MarketPulse label={t("home.hero.marketPulse")} values={pulseValues} tag={t("home.hero.marketTag")} />

        <ActivityBand
          items={[
            { label: t("home.hero.status"), value: statusLabel(sub.status, t), tone: sub.is_active ? "success" : "warning" },
            { label: t("home.hero.until"), value: formatDate(sub.ends_at, language, "-") },
            { label: t("home.hero.pendingPayments"), value: pendingPayments, tone: pendingPayments > 0 ? "warning" : "accent" },
          ]}
        />

        <CTACluster>
          <Link className="pb-btn pb-btn-primary" to="/feed">
            {t("home.hero.ctaSignals")}
          </Link>
          <Link className="pb-btn pb-btn-secondary" to="/tariffs">
            {t("layout.main.openTariffs")}
          </Link>
        </CTACluster>
      </section>

      <AppShellSection className="pb-today-panel">
        <SectionHeader title={t("home.today.title")} subtitle={t("home.today.subtitle")} action={<span className="pb-hint-chip">{predictions.length || stats?.total || 0}</span>} />

        {summaryLoading ? (
          <>
            <RocketLoader title={t("home.loadingTitle")} subtitle={t("home.loadingSubtitle")} compact />
            <div className="pb-today-skeleton" aria-hidden="true">
              <SkeletonBlock className="h-86" />
              <SkeletonBlock className="h-86" />
              <SkeletonBlock className="h-86" />
            </div>
          </>
        ) : null}

        {!summaryLoading && summaryError ? (
          <div className="pb-error-state">
            <p>{summaryError || t("home.today.error")}</p>
            <CTACluster>
              <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setRefreshTick((prev) => prev + 1)}>
                {t("common.retry")}
              </button>
            </CTACluster>
          </div>
        ) : null}

        {!summaryLoading && !summaryError && today.activeSignals === 0 && today.settledToday === 0 ? <p className="pb-empty-state">{t("home.today.empty")}</p> : null}

        {!summaryLoading && !summaryError ? (
          <div className="pb-today-composer">
            <article className="pb-today-main pb-today-main-hero">
              <span>{t("home.today.active")}</span>
              <AnimatedNumber value={today.activeSignals} />
              <small>{t("home.today.liveNow")}: {today.liveNow}</small>
            </article>

            <div className="pb-today-stripe">
              <article>
                <span>{t("home.today.free")}</span>
                <AnimatedNumber value={today.freeCount} />
              </article>
              <article>
                <span>{t("home.today.premium")}</span>
                <AnimatedNumber value={today.premiumCount} />
              </article>
              <article>
                <span>{t("home.today.vip")}</span>
                <AnimatedNumber value={today.vipCount} />
              </article>
              <article>
                <span>{t("home.today.settled")}</span>
                <AnimatedNumber value={today.settledToday} />
              </article>
            </div>

            <p className="pb-today-source">{today.source === "realtime" ? t("home.today.dataRealtime") : t("home.today.dataFallback")}</p>
          </div>
        ) : null}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("home.story.title")} subtitle={t("home.story.subtitle")} />
        <div className="pb-story-grid">
          <article>
            <h3>{t("home.story.p1.title")}</h3>
            <p>{t("home.story.p1.text")}</p>
          </article>
          <article>
            <h3>{t("home.story.p2.title")}</h3>
            <p>{t("home.story.p2.text")}</p>
          </article>
          <article>
            <h3>{t("home.story.p3.title")}</h3>
            <p>{t("home.story.p3.text")}</p>
          </article>
          <article>
            <h3>{t("home.story.p4.title")}</h3>
            <p>{t("home.story.p4.text")}</p>
          </article>
        </div>
      </AppShellSection>

      <div className="pb-home-split">
        <AppShellSection>
          <SectionHeader title={t("home.access.title")} subtitle={t("home.access.subtitle")} />
          <div className="pb-access-level-panel">
            <div className="pb-access-ring" style={accessRingStyle}>
              <div>
                <small>{t("home.access.openNow")}</small>
                <strong>{accessProgress}%</strong>
              </div>
            </div>
            <div className="pb-access-cluster">
              <span className={sub.tariff === "free" ? "active" : ""}>{t("common.free")}</span>
              <span className={sub.tariff === "premium" || sub.tariff === "vip" ? "active" : ""}>{t("common.premium")}</span>
              <span className={sub.tariff === "vip" ? "active" : ""}>{t("common.vip")}</span>
            </div>
          </div>
          <div className="pb-info-list">
            <div>
              <span>{t("home.access.tariff")}</span>
              <strong>{tariffLabel(sub.tariff, t)}</strong>
            </div>
            <div>
              <span>{t("home.access.status")}</span>
              <strong>{statusLabel(sub.status, t)}</strong>
            </div>
            <div>
              <span>{t("home.access.until")}</span>
              <strong>{formatDate(sub.ends_at, language, "-")}</strong>
            </div>
            <div>
              <span>{t("home.access.bonus")}</span>
              <strong>{referral?.bonus_days ?? 0}</strong>
            </div>
            <div>
              <span>{t("home.access.openNow")}</span>
              <strong>{accessNowLabel(sub.tariff, t)}</strong>
            </div>
            <div>
              <span>{t("home.access.pending")}</span>
              <strong>{pendingPayments}</strong>
            </div>
          </div>
          <CTACluster>
            <Link className="pb-btn pb-btn-secondary" to="/profile">
              {t("home.access.action")}
            </Link>
          </CTACluster>
        </AppShellSection>

        <AppShellSection>
          <SectionHeader title={t("home.performance.title")} subtitle={t("home.performance.subtitle")} />
          <div className="pb-metric-grid">
            <article>
              <span>{t("common.roi")}</span>
              <AnimatedNumber value={stats?.roi ?? 0} suffix="%" decimals={1} />
            </article>
            <article>
              <span>{t("home.performance.hit")}</span>
              <AnimatedNumber value={stats?.hit_rate ?? 0} suffix="%" decimals={1} />
            </article>
            <article>
              <span>{t("home.performance.total")}</span>
              <AnimatedNumber value={stats?.total ?? 0} />
            </article>
            <article>
              <span>{t("home.performance.ratio")}</span>
              <strong>{`${stats?.wins ?? 0}/${stats?.loses ?? 0}/${stats?.refunds ?? 0}`}</strong>
            </article>
          </div>
          <div className="pb-sparkline-panel">
            <Sparkline values={performanceWave} className="pb-sparkline-band" />
          </div>
          <CTACluster>
            <Link className="pb-btn pb-btn-ghost" to="/stats">
              {t("home.performance.action")}
            </Link>
          </CTACluster>
        </AppShellSection>
      </div>

      <AppShellSection>
        <SectionHeader title={t("home.ref.title")} subtitle={t("home.ref.subtitle")} />
        <ActivityBand
          items={[
            { label: t("home.ref.invited"), value: referral?.invited ?? 0 },
            { label: t("home.ref.activated"), value: referral?.activated ?? 0, tone: "accent" },
            { label: t("home.ref.bonus"), value: referral?.bonus_days ?? 0, tone: "success" },
          ]}
        />
        <CTACluster>
          <Link className="pb-btn pb-btn-ghost" to="/profile#referral">
            {t("home.ref.action")}
          </Link>
        </CTACluster>
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("home.news.title")} subtitle={t("home.news.subtitle")} />

        {loading ? (
          <div className="pb-news-grid" aria-hidden="true">
            <article className="pb-news-card pb-skeleton-card">
              <SkeletonBlock className="w-60" />
              <SkeletonBlock className="w-96 h-66" />
              <SkeletonBlock className="w-35" />
            </article>
            <article className="pb-news-card pb-skeleton-card">
              <SkeletonBlock className="w-50" />
              <SkeletonBlock className="w-90 h-66" />
              <SkeletonBlock className="w-30" />
            </article>
            <article className="pb-news-card pb-skeleton-card">
              <SkeletonBlock className="w-55" />
              <SkeletonBlock className="w-94 h-66" />
              <SkeletonBlock className="w-33" />
            </article>
          </div>
        ) : null}

        {!loading && previewNews.length === 0 ? <p className="pb-empty-state">{t("home.news.empty")}</p> : null}

        {previewNews.length > 0 ? (
          <div className="pb-home-news-preview">
            {previewNews.map((item) => (
              <Link key={item.id} className="pb-home-news-item" to={`/news/${item.id}`}>
                <h3>{item.title}</h3>
                <p>{buildNewsPreview(item.body)}</p>
                <small>{formatDate(item.published_at, language, t("common.noDate"))}</small>
              </Link>
            ))}
          </div>
        ) : null}

        <CTACluster>
          <Link className="pb-btn pb-btn-ghost" to="/news">
            {t("home.news.openAll")}
          </Link>
        </CTACluster>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
