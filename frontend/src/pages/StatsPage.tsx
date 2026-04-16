import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { PremiumRing } from "../components/premium/PremiumRing";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
import { SkeletonBlock, Sparkline } from "../components/ui";
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
  const roiText = `${(stats?.roi ?? 0).toFixed(1)}%`;
  const hitRateText = `${(stats?.hit_rate ?? 0).toFixed(1)}%`;

  const tierShare = useMemo(
    () =>
      ringItems.map((item) => ({
        ...item,
        share: Math.round((item.value / ringTotal) * 100),
      })),
    [ringItems, ringTotal],
  );

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
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(82, 126, 170, 0.5)",
            background:
              "radial-gradient(circle at 86% -25%, rgba(39, 211, 237, 0.18), transparent 46%), linear-gradient(160deg, rgba(9, 22, 36, 0.86), rgba(7, 16, 28, 0.94))",
            padding: 12,
            marginBottom: 10,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            <article style={{ border: "1px solid rgba(106, 151, 198, 0.35)", borderRadius: 11, background: "rgba(255, 255, 255, 0.03)", padding: "7px 9px" }}>
              <small style={{ color: "#88a4c1", fontSize: 11 }}>{t("common.roi")}</small>
              <strong style={{ display: "block", color: "#e7f6ff", fontSize: 20, lineHeight: 1.1 }}>{roiText}</strong>
            </article>
            <article style={{ border: "1px solid rgba(106, 151, 198, 0.35)", borderRadius: 11, background: "rgba(255, 255, 255, 0.03)", padding: "7px 9px" }}>
              <small style={{ color: "#88a4c1", fontSize: 11 }}>{t("home.performance.hit")}</small>
              <strong style={{ display: "block", color: "#73f0d0", fontSize: 20, lineHeight: 1.1 }}>{hitRateText}</strong>
            </article>
            <article style={{ border: "1px solid rgba(106, 151, 198, 0.35)", borderRadius: 11, background: "rgba(255, 255, 255, 0.03)", padding: "7px 9px" }}>
              <small style={{ color: "#88a4c1", fontSize: 11 }}>{t("stats.kpi.total")}</small>
              <strong style={{ display: "block", color: "#e7f6ff", fontSize: 20, lineHeight: 1.1 }}>{stats?.total ?? 0}</strong>
            </article>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {tierShare.map((item) => {
              const toneColor = item.tone === "premium" ? "#32dfbc" : item.tone === "vip" ? "#d7b67f" : "#7dc6ff";
              return (
                <article
                  key={item.label}
                  style={{
                    border: `1px solid ${item.tone === "premium" ? "rgba(50, 223, 188, 0.42)" : item.tone === "vip" ? "rgba(215, 182, 127, 0.48)" : "rgba(125, 198, 255, 0.42)"}`,
                    borderRadius: 11,
                    background: "rgba(7, 21, 36, 0.66)",
                    padding: "8px 9px",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <span style={{ color: toneColor, fontSize: 11, fontWeight: 700 }}>{item.label}</span>
                  <strong style={{ color: "#ecf8ff", fontSize: 19, lineHeight: 1 }}>{item.value}</strong>
                  <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.max(4, item.share)}%`, background: `linear-gradient(90deg, ${toneColor}, rgba(255,255,255,0.9))` }} />
                  </div>
                  <small style={{ color: "#87a0bd", fontSize: 10 }}>{item.share}%</small>
                </article>
              );
            })}
          </div>
        </div>

        <div className="pb-stats-v4-hero-grid">
          <PremiumRing value={stats?.hit_rate ?? 0} label={t("home.performance.hit")} caption={`${stats?.total ?? 0} ${t("stats.kpi.total")}`} />

          <div className="pb-stats-v4-kpi-grid">
            <PremiumKpi label={t("common.roi")} value={roiText} tone="accent" emphasized />
            <PremiumKpi label={t("stats.kpi.wins")} value={wins} tone="success" />
            <PremiumKpi label={t("stats.kpi.loses")} value={loses} tone="warning" />
            <PremiumKpi label={t("stats.kpi.pending")} value={pending} />
          </div>
        </div>

        <Sparkline values={heroWave} className="pb-stats-v4-hero-wave" />
      </HeroPanel>

      {loading ? (
        <section className="pb-premium-panel pb-reveal">
          <AIScanningLoader compact />
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

            <div className="pb-stats-v4-bars pb-stats-v4-bars-3d">
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
