import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, SectionActions, SectionHeader, Sparkline, StatCard } from "../components/ui";
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

  return (
    <Layout>
      <HeroCard eyebrow="PIT BET" title={t("stats.hero.title")} description={t("stats.hero.subtitle")}>
        <div className="market-ribbon stats-ribbon">
          <span>{t("stats.hero.pulse")}</span>
          <Sparkline values={[60, 54, 58, 49, 44, 52, 47, 38, 41, 33]} />
          <span className="live-pulse">{t("common.roi")}</span>
        </div>
        <div className="stat-grid compact">
          <StatCard label={t("home.performance.total")} value={stats?.total ?? 0} tone="accent" />
          <StatCard label={t("home.performance.hit")} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
          <StatCard label={t("common.roi")} value={`${stats?.roi ?? 0}%`} tone="warning" />
          <StatCard label={t("stats.pending")} value={stats?.pending ?? 0} />
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader title={t("stats.kpi.title")} subtitle={t("stats.kpi.subtitle")} />

        {loading ? <p className="muted-line">{t("common.loading")}</p> : null}
        {!loading && !stats ? (
          <div className="empty-block subtle">
            <p className="empty-state">{t("stats.error")}</p>
            <p className="muted-line">{t("stats.retry")}</p>
          </div>
        ) : null}

        {stats ? (
          <>
            <div className="stat-grid compact">
              <StatCard label={t("stats.wins")} value={stats.wins} tone="success" />
              <StatCard label={t("stats.loses")} value={stats.loses} tone="warning" />
              <StatCard label={t("stats.refunds")} value={stats.refunds} />
              <StatCard label={t("stats.total")} value={stats.total} tone="accent" />
            </div>

            <div className="stats-structure-block">
              <SectionHeader title={t("stats.byAccess.title")} subtitle={t("stats.byAccess.subtitle")} />
              <div className="stat-grid compact">
                <StatCard label={t("common.free")} value={stats.by_access?.free ?? 0} />
                <StatCard label={t("common.premium")} value={stats.by_access?.premium ?? 0} tone="accent" />
                <StatCard label={t("common.vip")} value={stats.by_access?.vip ?? 0} tone="warning" />
              </div>
            </div>

            <div className="insight-card">
              <strong>{t("stats.insight.title")}</strong>
              <p>{t("stats.insight.text")}</p>
            </div>

            <SectionActions compact>
              <Link className="btn secondary" to="/feed">{t("stats.openFeed")}</Link>
              <Link className="btn ghost" to="/tariffs">{t("stats.openTariffs")}</Link>
            </SectionActions>
          </>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
