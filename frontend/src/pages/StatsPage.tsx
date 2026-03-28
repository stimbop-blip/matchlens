import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  ActivityBand,
  AnimatedNumber,
  AppShellSection,
  CTACluster,
  InsightCard,
  MarketPulse,
  ProgressMeter,
  RingStat,
  RocketLoader,
  SectionHeader,
  SkeletonBlock,
  Sparkline,
} from "../components/ui";
import { api, type PublicStats } from "../services/api";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function StatsPage() {
  const { t } = useI18n();

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    api
      .stats()
      .then((payload) => {
        if (!alive) return;
        setStats(payload);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setStats(null);
        setError(parseErrorMessage(e, ""));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const total = Math.max(1, stats?.total ?? 1);
  const wins = stats?.wins ?? 0;
  const loses = stats?.loses ?? 0;
  const refunds = stats?.refunds ?? 0;
  const pending = stats?.pending ?? 0;

  const ringItems = useMemo(
    () => [
      { label: t("common.free"), value: Number(stats?.by_access?.free ?? 0), color: "#57a3ff" },
      { label: t("common.premium"), value: Number(stats?.by_access?.premium ?? 0), color: "#1dd7c2" },
      { label: t("common.vip"), value: Number(stats?.by_access?.vip ?? 0), color: "#f9be6f" },
    ],
    [stats, t]
  );

  const trendValues = useMemo(() => {
    const slices = [pending, refunds, loses, wins];
    let running = 0;
    return slices.map((value) => {
      running += value;
      return Math.round((running / total) * 100);
    });
  }, [pending, refunds, loses, wins, total]);

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className="pb-live-pill">{t("stats.hero.pulse")}</span>
        </div>

        <h2>{t("stats.hero.title")}</h2>
        <p>{t("stats.hero.subtitle")}</p>

        <MarketPulse label={t("stats.visual.title")} values={trendValues.length ? trendValues : [0, 0, 0, 0]} tag={t("common.roi")} />

        <div className="pb-metric-grid tight pb-stats-kpi-grid">
          <article>
            <span>{t("common.roi")}</span>
            <AnimatedNumber value={stats?.roi ?? 0} suffix="%" decimals={1} />
          </article>
          <article>
            <span>{t("home.performance.hit")}</span>
            <AnimatedNumber value={stats?.hit_rate ?? 0} suffix="%" decimals={1} />
          </article>
          <article>
            <span>{t("stats.kpi.total")}</span>
            <AnimatedNumber value={stats?.total ?? 0} />
          </article>
          <article>
            <span>{t("stats.kpi.pending")}</span>
            <AnimatedNumber value={stats?.pending ?? 0} />
          </article>
        </div>
      </section>

      <AppShellSection className="pb-stats-section">
        <SectionHeader title={t("stats.kpi.title")} />
        <div className="pb-stats-band-wrap">
          <ActivityBand
            items={[
              { label: t("stats.kpi.wins"), value: wins, tone: "success" },
              { label: t("stats.kpi.loses"), value: loses, tone: "warning" },
              { label: t("stats.kpi.refunds"), value: refunds },
              { label: t("stats.kpi.pending"), value: pending },
              { label: t("stats.kpi.total"), value: stats?.total ?? 0, tone: "accent" },
            ]}
          />
        </div>
      </AppShellSection>

      {loading ? (
        <AppShellSection>
          <RocketLoader title={t("stats.loadingTitle")} subtitle={t("stats.loadingSubtitle")} compact />
          <div className="pb-insight-grid" aria-hidden="true">
            <article className="pb-insight-card pb-skeleton-card">
              <SkeletonBlock className="w-55" />
              <SkeletonBlock className="w-96 h-56" />
            </article>
            <article className="pb-insight-card pb-skeleton-card">
              <SkeletonBlock className="w-45" />
              <SkeletonBlock className="w-90 h-56" />
            </article>
          </div>
        </AppShellSection>
      ) : null}

      {!loading && error ? (
        <AppShellSection>
          <p className="pb-error-state">{error || t("stats.error")}</p>
          <CTACluster>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </CTACluster>
        </AppShellSection>
      ) : null}

      {!loading && !stats && !error ? (
        <AppShellSection>
          <SectionHeader title={t("stats.empty.title")} subtitle={t("stats.empty.subtitle")} />
        </AppShellSection>
      ) : null}

      {stats && !loading ? (
        <>
          <AppShellSection className="pb-stats-section">
            <SectionHeader title={t("stats.breakdown.title")} subtitle={t("stats.breakdown.subtitle")} />
            <RingStat title={t("stats.breakdown.title")} subtitle={t("stats.kpi.total")} items={ringItems} />
          </AppShellSection>

          <AppShellSection className="pb-stats-section">
            <SectionHeader title={t("stats.visual.title")} subtitle={t("stats.visual.subtitle")} />
            <Sparkline values={trendValues} className="pb-sparkline-band" />
            <div className="pb-progress-list">
              <ProgressMeter label={t("stats.kpi.wins")} value={wins} total={total} tone="success" />
              <ProgressMeter label={t("stats.kpi.loses")} value={loses} total={total} tone="danger" />
              <ProgressMeter label={t("stats.kpi.refunds")} value={refunds} total={total} tone="warning" />
              <ProgressMeter label={t("stats.kpi.pending")} value={pending} total={total} tone="accent" />
            </div>
          </AppShellSection>

          <AppShellSection className="pb-stats-section">
            <SectionHeader title={t("stats.insights.title")} />
            <div className="pb-insight-grid pb-stats-insight-grid">
              <InsightCard title={t("common.roi")} text={t("stats.insight.one", { hit: `${stats.hit_rate}%`, roi: `${stats.roi}%` })} tone="accent" />
              <InsightCard title={t("stats.breakdown.title")} text={t("stats.insight.two")} />
            </div>

            <CTACluster>
              <Link className="pb-btn pb-btn-secondary" to="/feed">
                {t("stats.cta.feed")}
              </Link>
              <Link className="pb-btn pb-btn-ghost" to="/tariffs">
                {t("stats.cta.tariffs")}
              </Link>
            </CTACluster>
          </AppShellSection>
        </>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}
