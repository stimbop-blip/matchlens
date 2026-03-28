import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { countPendingPayments, resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, ActivityBand, AnimatedNumber, AppShellSection, CTACluster, NewsRibbon, SectionHeader } from "../components/ui";
import { api, type MyPayment, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

type TodaySummary = {
  activeSignals: number;
  liveNow: number;
  freeCount: number;
  premiumCount: number;
  vipCount: number;
  settledToday: number;
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

function buildTodaySummary(items: Prediction[]): TodaySummary {
  const today = new Date();
  const summary: TodaySummary = {
    activeSignals: 0,
    liveNow: 0,
    freeCount: 0,
    premiumCount: 0,
    vipCount: 0,
    settledToday: 0,
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

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [payments, setPayments] = useState<MyPayment[]>([]);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([api.stats(), api.mySubscription(), api.myReferral(), api.news(), api.myPayments()]);
      if (!alive) return;

      const [statsRes, subRes, refRes, newsRes, payRes] = results;
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
      setPayments(payRes.status === "fulfilled" ? payRes.value : []);
      setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

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
  }, [summaryReloadKey]);

  const sub = resolveSubscriptionSnapshot(subscriptionRaw);
  const pendingPayments = countPendingPayments(payments);
  const today = useMemo(() => buildTodaySummary(predictions), [predictions]);
  const previewNews = news.slice(0, 2);

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-brand-chip large">PIT BET</span>
          <AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />
        </div>

        <h2>{t("home.hero.headline")}</h2>
        <p>{t("home.hero.subheadline")}</p>

        <ActivityBand
          items={[
            { label: t("home.hero.status"), value: statusLabel(sub.status, t), tone: sub.is_active ? "success" : "warning" },
            { label: t("home.hero.until"), value: formatDate(sub.ends_at, language, "—") },
            { label: t("home.hero.pendingPayments"), value: pendingPayments, tone: pendingPayments > 0 ? "warning" : "accent" },
          ]}
        />

        <CTACluster>
          <Link className="pb-btn pb-btn-primary" to="/feed">
            {t("home.hero.ctaSignals")}
          </Link>
          <Link className="pb-btn pb-btn-secondary" to="/stats">
            {t("home.performance.action")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/profile">
            {t("home.hero.ctaAccess")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/menu">
            {t("home.hero.ctaHub")}
          </Link>
        </CTACluster>
      </section>

      <AppShellSection className="pb-today-panel">
        <SectionHeader title={t("home.today.title")} subtitle={t("home.today.subtitle")} action={<span className="pb-hint-chip">{predictions.length}</span>} />

        {summaryLoading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}

        {!summaryLoading && summaryError ? (
          <div className="pb-error-state">
            <p>{summaryError || t("home.today.error")}</p>
            <CTACluster>
              <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setSummaryReloadKey((prev) => prev + 1)}>
                {t("common.retry")}
              </button>
            </CTACluster>
          </div>
        ) : null}

        {!summaryLoading && !summaryError && predictions.length === 0 ? <p className="pb-empty-state">{t("home.today.empty")}</p> : null}

        {!summaryLoading && !summaryError && predictions.length > 0 ? (
          <>
            <div className="pb-today-grid">
              <article className="pb-today-main">
                <span>{t("home.today.active")}</span>
                <AnimatedNumber value={today.activeSignals} />
              </article>

              <div className="pb-today-stack">
                <article>
                  <span>{t("home.today.liveNow")}</span>
                  <AnimatedNumber value={today.liveNow} />
                </article>
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
            </div>
          </>
        ) : null}
      </AppShellSection>

      <div className="pb-home-split">
        <AppShellSection>
          <SectionHeader title={t("home.access.title")} subtitle={t("home.access.subtitle")} />
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
              <strong>{formatDate(sub.ends_at, language, "—")}</strong>
            </div>
            <div>
              <span>{t("home.access.bonus")}</span>
              <strong>{referral?.bonus_days ?? 0}</strong>
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
              <span>{t("home.performance.total")}</span>
              <AnimatedNumber value={stats?.total ?? 0} />
            </article>
            <article>
              <span>{t("home.performance.hit")}</span>
              <AnimatedNumber value={stats?.hit_rate ?? 0} suffix="%" decimals={1} />
            </article>
            <article>
              <span>{t("common.roi")}</span>
              <AnimatedNumber value={stats?.roi ?? 0} suffix="%" decimals={1} />
            </article>
            <article>
              <span>{t("home.performance.ratio")}</span>
              <strong>{`${stats?.wins ?? 0}/${stats?.loses ?? 0}/${stats?.refunds ?? 0}`}</strong>
            </article>
          </div>
        </AppShellSection>
      </div>

      <AppShellSection>
        <SectionHeader title={t("home.news.title")} action={<Link className="pb-link-inline" to="/news">{t("home.news.all")}</Link>} />

        {loading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}
        {!loading && previewNews.length === 0 ? <p className="pb-empty-state">{t("home.news.empty")}</p> : null}

        {previewNews.length > 0 ? (
          <div className="pb-news-grid">
            {previewNews.map((item) => (
              <NewsRibbon
                key={item.id}
                title={item.title}
                body={item.body}
                category={item.category}
                meta={formatDate(item.published_at, language, t("common.noDate"))}
                to={`/news/${item.id}`}
              />
            ))}
          </div>
        ) : null}
      </AppShellSection>

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

      <AppDisclaimer />
    </Layout>
  );
}
