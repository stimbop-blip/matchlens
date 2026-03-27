import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ActivityBand, AnimatedNumber, AppShellSection, CTACluster, InsightCard, MarketPulse, RingStat, SectionHeader, Sparkline } from "../components/ui";
import { api, type PublicStats } from "../services/api";

export function StatsPage() {
  const { t } = useI18n();

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .stats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const ringItems = useMemo(
    () => [
      { label: t("common.free"), value: stats?.by_access?.free ?? 0, color: "#57a3ff" },
      { label: t("common.premium"), value: stats?.by_access?.premium ?? 0, color: "#1dd7c2" },
      { label: t("common.vip"), value: stats?.by_access?.vip ?? 0, color: "#f9be6f" },
    ],
    [stats, t]
  );

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className="pb-live-pill">{t("stats.hero.pulse")}</span>
        </div>

        <h2>{t("stats.hero.title")}</h2>
        <p>{t("stats.hero.subtitle")}</p>

        <MarketPulse label={t("stats.visual.title")} values={[40, 47, 44, 53, 58, 63, 57, 64, 68, 72]} tag={t("common.roi")} />

        <div className="pb-metric-grid tight">
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

      <AppShellSection>
        <SectionHeader title={t("stats.kpi.title")} />
        <ActivityBand
          items={[
            { label: t("stats.kpi.wins"), value: stats?.wins ?? 0, tone: "success" },
            { label: t("stats.kpi.loses"), value: stats?.loses ?? 0, tone: "warning" },
            { label: t("stats.kpi.refunds"), value: stats?.refunds ?? 0 },
            { label: t("stats.kpi.pending"), value: stats?.pending ?? 0 },
            { label: t("stats.kpi.total"), value: stats?.total ?? 0, tone: "accent" },
          ]}
        />
      </AppShellSection>

      {loading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}

      {!loading && !stats ? (
        <AppShellSection>
          <SectionHeader title={t("stats.empty.title")} subtitle={t("stats.empty.subtitle")} />
        </AppShellSection>
      ) : null}

      {stats ? (
        <>
          <AppShellSection>
            <SectionHeader title={t("stats.breakdown.title")} subtitle={t("stats.breakdown.subtitle")} />
            <RingStat title={t("stats.breakdown.title")} subtitle={t("stats.kpi.total")} items={ringItems} />
          </AppShellSection>

          <AppShellSection>
            <SectionHeader title={t("stats.visual.title")} subtitle={t("stats.visual.subtitle")} />
            <Sparkline values={[31, 34, 39, 37, 45, 49, 52, 55, 51, 58, 63, 66]} className="pb-sparkline-band" />
          </AppShellSection>

          <AppShellSection>
            <SectionHeader title={t("stats.insights.title")} />
            <div className="pb-insight-grid">
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
