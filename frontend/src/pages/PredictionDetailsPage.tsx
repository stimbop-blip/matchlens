import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSportLabel } from "../app/sport";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import {
  RocketLoader,
  SkeletonBlock,
  Sparkline,
  SportIcon,
} from "../components/ui";
import { api, type Prediction } from "../services/api";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function formatDate(value: string, language: "ru" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: Prediction["status"], t: (key: string) => string) {
  if (status === "won") return t("feed.status.won");
  if (status === "lost") return t("feed.status.lost");
  if (status === "refund") return t("feed.status.refund");
  return t("feed.status.pending");
}

function riskLabel(level: string, t: (key: string) => string) {
  if (level === "low") return t("common.risk.low");
  if (level === "high") return t("common.risk.high");
  return t("common.risk.medium");
}

function accessLabel(level: Prediction["access_level"], t: (key: string) => string) {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function outcomeText(status: Prediction["status"], t: (key: string) => string) {
  if (status === "won") return t("prediction.outcome.won");
  if (status === "lost") return t("prediction.outcome.lost");
  if (status === "refund") return t("prediction.outcome.refund");
  return t("prediction.outcome.pending");
}

function statusTone(status: Prediction["status"]): "default" | "success" | "warning" {
  if (status === "won") return "success";
  if (status === "lost") return "warning";
  if (status === "refund") return "warning";
  return "default";
}

function accessTone(level: Prediction["access_level"]): "default" | "accent" | "vip" {
  if (level === "premium") return "accent";
  if (level === "vip") return "vip";
  return "default";
}

function riskTone(level: string): "default" | "warning" {
  if (level === "high") return "warning";
  return "default";
}

export function PredictionDetailsPage() {
  const { t, language } = useI18n();
  const { predictionId } = useParams<{ predictionId: string }>();

  const [item, setItem] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!predictionId) {
      setItem(null);
      setError("missing");
      setLoading(false);
      return;
    }

    setItem(null);
    setLoading(true);
    setError("");
    api
      .prediction(predictionId)
      .then(setItem)
      .catch((e: unknown) => {
        setItem(null);
        setError(parseErrorMessage(e, ""));
      })
      .finally(() => setLoading(false));
  }, [predictionId, reloadKey]);

  const modeLabel = item ? (item.mode === "live" ? t("common.live") : t("common.prematch")) : "";

  const pulseValues = useMemo(() => {
    if (!item) return [58, 55, 57, 54, 51, 48, 45, 42, 39, 36];
    const base = item.mode === "live" ? 64 : 52;
    const oddsImpact = Math.round(Math.max(0, item.odds - 1) * 5);
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => base + oddsImpact - step * 2 + (step % 2 === 0 ? 1 : -1));
  }, [item]);

  const snapshotItems = useMemo(() => {
    if (!item) return [];
    return [
      {
        label: t("prediction.field.kickoff"),
        value: formatDate(item.event_start_at, language),
        tone: "default" as const,
      },
      {
        label: t("prediction.field.signal"),
        value: item.signal_type,
        tone: "accent" as const,
      },
      {
        label: t("prediction.field.mode"),
        value: modeLabel,
        tone: item.mode === "live" ? ("accent" as const) : ("default" as const),
      },
      {
        label: t("prediction.field.status"),
        value: statusLabel(item.status, t),
        tone: statusTone(item.status),
      },
      {
        label: t("prediction.field.access"),
        value: accessLabel(item.access_level, t),
        tone: accessTone(item.access_level),
      },
      {
        label: t("prediction.field.risk"),
        value: riskLabel(item.risk_level, t),
        tone: riskTone(item.risk_level),
      },
    ];
  }, [item, language, modeLabel, t]);

  return (
    <Layout>
      {loading ? (
        <section className="pb-premium-panel pb-reveal">
          <RocketLoader title={t("prediction.loadingTitle")} subtitle={t("prediction.loadingSubtitle")} compact />
          <div className="pb-overview-kpi-skeleton" aria-hidden="true">
            <SkeletonBlock className="h-96" />
            <SkeletonBlock className="h-86" />
            <SkeletonBlock className="h-86" />
          </div>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="pb-premium-panel pb-reveal">
          <div className="pb-error-state">
            <p>{error === "missing" ? t("prediction.error") : error || t("prediction.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && item ? (
        <>
          <HeroPanel
            eyebrow={t("prediction.hero.eyebrow")}
            title={item.match_name}
            subtitle={item.league || t("feed.noLeague")}
            right={<span className={`pb-tier-pill ${item.access_level}`}>{accessLabel(item.access_level, t)}</span>}
          >
            <div className="pb-details-v4-chip-row">
              <span className={`pb-details-v4-chip mode ${item.mode}`}>{modeLabel}</span>
              <span className={`pb-details-v4-chip status ${item.status}`}>{statusLabel(item.status, t)}</span>
              <span className="pb-details-v4-chip">{t("prediction.field.risk")}: {riskLabel(item.risk_level, t)}</span>
            </div>

            <div className="pb-details-v4-core">
              <div className="pb-details-v4-odds">
                <small>{t("prediction.field.odds")}</small>
                <strong>{item.odds}</strong>
              </div>

              <div className="pb-details-v4-spark-wrap">
                <div className="pb-details-v4-spark-head">
                  <span>{t("prediction.section.context")}</span>
                  <span className="pb-overview-live-tag">{modeLabel}</span>
                </div>
                <Sparkline values={pulseValues} className="pb-details-v4-sparkline" />
                <p>{t("prediction.context.line", { mode: modeLabel, access: accessLabel(item.access_level, t) })}</p>
              </div>
            </div>
          </HeroPanel>

          <section className="pb-premium-panel pb-details-v4-snapshot pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("prediction.section.snapshot")}</h3>
              <small>{t("prediction.section.why")}</small>
            </div>

            <div className="pb-details-v4-snapshot-grid">
              <article className="pb-details-v4-sport">
                <span>{t("prediction.field.sport")}</span>
                <strong>
                  <SportIcon sport={item.sport_type} />
                  <em>{resolveSportLabel(item.sport_type, language)}</em>
                </strong>
              </article>

              <div className="pb-details-v4-kpi-grid">
                {snapshotItems.map((metric) => (
                  <PremiumKpi key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
                ))}
              </div>
            </div>
          </section>

          <section className="pb-premium-panel pb-details-v4-analysis pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("prediction.section.why")}</h3>
              <small>{t("prediction.section.context")}</small>
            </div>

            <p className="pb-details-v4-text">{item.short_description || t("prediction.whyFallback")}</p>

            <div className="pb-details-v4-story-grid">
              <article>
                <h4>{t("prediction.field.mode")}</h4>
                <p>{t("prediction.context.line", { mode: modeLabel, access: accessLabel(item.access_level, t) })}</p>
              </article>
              <article>
                <h4>{t("prediction.section.context")}</h4>
                <p>{t("prediction.context.pattern")}</p>
              </article>
            </div>
          </section>

          {item.bet_screenshot || item.result_screenshot ? (
            <section className="pb-premium-panel pb-details-v4-shots pb-reveal">
              <div className="pb-premium-head">
                <h3>{t("prediction.section.screenshot")}</h3>
                <small>{t("prediction.section.screenshotSubtitle")}</small>
              </div>

              <div className="pb-prediction-screenshot-grid">
                {item.bet_screenshot ? (
                  <article className="pb-prediction-screenshot-block">
                    <h4>{t("prediction.section.betScreenshot")}</h4>
                    <div className="pb-prediction-screenshot">
                      <img src={item.bet_screenshot} alt={t("prediction.screenshot.betAlt")} loading="lazy" />
                    </div>
                  </article>
                ) : null}
                {item.result_screenshot ? (
                  <article className="pb-prediction-screenshot-block">
                    <h4>{t("prediction.section.resultScreenshot")}</h4>
                    <div className="pb-prediction-screenshot">
                      <img src={item.result_screenshot} alt={t("prediction.screenshot.resultAlt")} loading="lazy" />
                    </div>
                  </article>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="pb-premium-panel pb-details-v4-outcome pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("prediction.section.outcome")}</h3>
            </div>

            <p className="pb-details-v4-text">{outcomeText(item.status, t)}</p>

            <div className="pb-details-v4-actions">
              <Link className="pb-btn pb-btn-secondary" to="/feed">
                {t("prediction.cta.feed")}
              </Link>
              <Link className="pb-btn pb-btn-ghost" to="/tariffs">
                {t("prediction.cta.tariffs")}
              </Link>
            </div>
          </section>
        </>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}
