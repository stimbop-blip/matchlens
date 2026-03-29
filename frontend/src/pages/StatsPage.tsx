import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { PremiumRing } from "../components/premium/PremiumRing";
import { RocketLoader, SkeletonBlock, Sparkline } from "../components/ui";
import { api, type PublicStats } from "../services/api";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function StatsPage() {
  const { t, language } = useI18n();

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
      { label: t("common.free"), value: Number(stats?.by_access?.free ?? 0), tone: "free" as const },
      { label: t("common.premium"), value: Number(stats?.by_access?.premium ?? 0), tone: "premium" as const },
      { label: t("common.vip"), value: Number(stats?.by_access?.vip ?? 0), tone: "vip" as const },
    ],
    [stats, t],
  );

  const ringTotal = Math.max(1, ringItems.reduce((acc, item) => acc + item.value, 0));

  const trendValues = useMemo<number[]>(() => {
    const slices = [pending, refunds, loses, wins];
    let running = 0;
    return slices.map((value) => {
      running += value;
      return Math.round((running / total) * 100);
    });
  }, [pending, refunds, loses, wins, total]);

  const heroWave = useMemo<number[]>(() => {
    const roi = stats?.roi ?? 0;
    const hit = stats?.hit_rate ?? 0;
    return [56, 59, 58, 62, 65, 63, 68, 66, 71, 74].map((value, index) => value + Math.round(roi / 12) + Math.round(hit / 22) + (index % 2));
  }, [stats?.roi, stats?.hit_rate]);

  const insightPending =
    language === "ru"
      ? `Сейчас в работе ${pending} сигналов. Это нормальная нагрузка для текущего ритма публикаций.`
      : `${pending} signals are still in play. This is a healthy load for the current publishing rhythm.`;

  return (
    <Layout>
      <HeroPanel eyebrow="Performance Center" title={t("stats.hero.title")} subtitle={t("stats.hero.subtitle")} right={<span className="pb-stats-v4-live">{t("stats.hero.pulse")}</span>}>
        <div className="pb-stats-v4-hero-grid">
          <PremiumRing value={stats?.hit_rate ?? 0} label={t("home.performance.hit")} caption={`${stats?.total ?? 0} ${t("stats.kpi.total")}`} />

          <div className="pb-stats-v4-kpi-grid">
            <PremiumKpi label={t("common.roi")} value={`${(stats?.roi ?? 0).toFixed(1)}%`} tone="accent" emphasized />
            <PremiumKpi label={t("stats.kpi.wins")} value={wins} tone="success" />
            <PremiumKpi label={t("stats.kpi.loses")} value={loses} tone="warning" />
            <PremiumKpi label={t("stats.kpi.pending")} value={pending} />
          </div>
        </div>

        <Sparkline values={heroWave} className="pb-stats-v4-hero-wave" />
      </HeroPanel>

      {loading ? (
        <section className="pb-premium-panel pb-reveal">
          <RocketLoader title={t("stats.loadingTitle")} subtitle={t("stats.loadingSubtitle")} compact />
          <div className="pb-stats-v4-skeleton" aria-hidden="true">
            <SkeletonBlock className="h-96" />
            <SkeletonBlock className="h-88" />
            <SkeletonBlock className="h-84" />
          </div>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="pb-premium-panel pb-reveal">
          <div className="pb-error-state">
            <p>{error || t("stats.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && !stats && !error ? (
        <section className="pb-premium-panel pb-reveal">
          <h3>{t("stats.empty.title")}</h3>
          <p className="pb-empty-state">{t("stats.empty.subtitle")}</p>
        </section>
      ) : null}

      {stats && !loading ? (
        <>
          <section className="pb-premium-panel pb-stats-v4-distribution pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("stats.kpi.title")}</h3>
              <small>{t("stats.visual.subtitle")}</small>
            </div>

            <Sparkline values={trendValues} className="pb-stats-v4-main-wave" />

            <div className="pb-stats-v4-bars">
              {[
                { label: t("stats.kpi.wins"), value: wins, tone: "success" },
                { label: t("stats.kpi.loses"), value: loses, tone: "danger" },
                { label: t("stats.kpi.refunds"), value: refunds, tone: "warning" },
                { label: t("stats.kpi.pending"), value: pending, tone: "accent" },
              ].map((item) => {
                const width = `${Math.max(4, Math.round((item.value / total) * 100))}%`;
                return (
                  <article key={item.label} className="pb-stats-v4-bar-item">
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="pb-stats-v4-track">
                      <span className={`pb-stats-v4-fill ${item.tone}`} style={{ width }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="pb-premium-panel pb-stats-v4-access pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("stats.breakdown.title")}</h3>
              <small>{t("stats.breakdown.subtitle")}</small>
            </div>

            <div className="pb-stats-v4-access-grid">
              {ringItems.map((item) => {
                const ratio = Math.round((item.value / ringTotal) * 100);
                return (
                  <article key={item.label} className={`pb-stats-v4-access-item ${item.tone}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{ratio}%</small>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="pb-premium-panel pb-stats-v4-insights pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("stats.insights.title")}</h3>
            </div>

            <div className="pb-stats-v4-insight-grid">
              <article>
                <h4>{t("common.roi")}</h4>
                <p>{t("stats.insight.one", { hit: `${stats.hit_rate}%`, roi: `${stats.roi}%` })}</p>
              </article>
              <article>
                <h4>{t("stats.breakdown.title")}</h4>
                <p>{t("stats.insight.two")}</p>
              </article>
              <article>
                <h4>{t("stats.kpi.pending")}</h4>
                <p>{insightPending}</p>
              </article>
            </div>

            <div className="pb-stats-v4-actions">
              <Link className="pb-btn pb-btn-secondary" to="/feed">
                {t("stats.cta.feed")}
              </Link>
              <Link className="pb-btn pb-btn-ghost" to="/tariffs">
                {t("stats.cta.tariffs")}
              </Link>
            </div>
          </section>
        </>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}
