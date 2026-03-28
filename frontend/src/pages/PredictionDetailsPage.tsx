import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSportLabel } from "../app/sport";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  AccessBadge,
  ActivityBand,
  AppShellSection,
  CTACluster,
  MarketPulse,
  RocketLoader,
  SectionHeader,
  SkeletonBlock,
  StatusPill,
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

function statusTone(status: Prediction["status"]): "default" | "success" | "warning" | "danger" {
  if (status === "won") return "success";
  if (status === "lost") return "danger";
  if (status === "refund") return "warning";
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
      setError("missing");
      setLoading(false);
      return;
    }

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

  const pulseValues = useMemo(() => {
    if (!item) return [58, 55, 57, 54, 51, 48, 45, 42, 39, 36];
    const base = item.mode === "live" ? 64 : 52;
    const oddsImpact = Math.round(Math.max(0, item.odds - 1) * 5);
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => base + oddsImpact - step * 2 + (step % 2 === 0 ? 1 : -1));
  }, [item]);

  return (
    <Layout>
      {item ? (
        <section className="pb-hero-panel pb-reveal">
          <div className="pb-hero-top">
            <span className="pb-eyebrow">{t("prediction.hero.eyebrow")}</span>
            <AccessBadge level={item.access_level} label={accessLabel(item.access_level, t)} />
          </div>

          <h2>{item.match_name}</h2>
          <p>{item.league || t("feed.noLeague")}</p>

          <div className="pb-meta-line">
            <StatusPill label={item.mode === "live" ? t("common.live") : t("common.prematch")} tone="accent" />
            <StatusPill label={statusLabel(item.status, t)} tone={statusTone(item.status)} />
            <StatusPill label={`${t("prediction.field.odds")}: ${item.odds}`} />
            <StatusPill label={`${t("prediction.field.risk")}: ${riskLabel(item.risk_level, t)}`} tone="warning" />
          </div>

          <MarketPulse label={t("prediction.section.context")} values={pulseValues} tag={item.mode === "live" ? t("common.live") : t("common.prematch")} />

          <ActivityBand
            items={[
              { label: t("prediction.field.kickoff"), value: formatDate(item.event_start_at, language) },
              { label: t("prediction.field.status"), value: statusLabel(item.status, t), tone: item.status === "won" ? "success" : "default" },
              { label: t("prediction.field.access"), value: accessLabel(item.access_level, t), tone: "accent" },
            ]}
          />
        </section>
      ) : null}

      <AppShellSection>
        <SectionHeader title={t("prediction.section.snapshot")} subtitle={t("prediction.section.why")} />

        {loading ? (
          <>
            <RocketLoader title={t("prediction.loadingTitle")} subtitle={t("prediction.loadingSubtitle")} compact />
            <article className="pb-panel pb-skeleton-card" aria-hidden="true">
              <SkeletonBlock className="w-45" />
              <SkeletonBlock className="w-95 h-74" />
            </article>
          </>
        ) : null}

        {!loading && error ? (
          <div className="pb-error-state">
            <p>{error === "missing" ? t("prediction.error") : error || t("prediction.error")}</p>
            <CTACluster>
              <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
                {t("common.retry")}
              </button>
            </CTACluster>
          </div>
        ) : null}

        {!loading && item ? (
          <div className="pb-info-list">
            <div>
              <span>{t("prediction.field.sport")}</span>
              <strong className="pb-sport-value">
                <SportIcon sport={item.sport_type} />
                <span>{resolveSportLabel(item.sport_type, language)}</span>
              </strong>
            </div>
            <div>
              <span>{t("prediction.field.kickoff")}</span>
              <strong>{formatDate(item.event_start_at, language)}</strong>
            </div>
            <div>
              <span>{t("prediction.field.signal")}</span>
              <strong>{item.signal_type}</strong>
            </div>
            <div>
              <span>{t("prediction.field.mode")}</span>
              <strong>{item.mode === "live" ? t("common.live") : t("common.prematch")}</strong>
            </div>
            <div>
              <span>{t("prediction.field.status")}</span>
              <strong>{statusLabel(item.status, t)}</strong>
            </div>
            <div>
              <span>{t("prediction.field.access")}</span>
              <strong>{accessLabel(item.access_level, t)}</strong>
            </div>
          </div>
        ) : null}
      </AppShellSection>

      {item ? (
        <>
          <AppShellSection>
            <SectionHeader title={t("prediction.section.why")} />
            <p className="pb-article-text">{item.short_description || t("prediction.whyFallback")}</p>
          </AppShellSection>

          <AppShellSection>
            <SectionHeader title={t("prediction.section.context")} subtitle={t("prediction.section.snapshot")} />
            <div className="pb-story-grid single">
              <article>
                <h3>{t("prediction.field.mode")}</h3>
                <p>{t("prediction.context.line", { mode: item.mode === "live" ? t("common.live") : t("common.prematch"), access: accessLabel(item.access_level, t) })}</p>
              </article>
              <article>
                <h3>{t("prediction.section.why")}</h3>
                <p>{t("prediction.context.pattern")}</p>
              </article>
            </div>
          </AppShellSection>

          {item.result_screenshot ? (
            <AppShellSection>
              <SectionHeader title={t("prediction.section.screenshot")} subtitle={t("prediction.section.screenshotSubtitle")} />
              <div className="pb-prediction-screenshot">
                <img src={item.result_screenshot} alt={t("prediction.screenshot.alt")} loading="lazy" />
              </div>
            </AppShellSection>
          ) : null}

          <AppShellSection>
            <SectionHeader title={t("prediction.section.outcome")} />
            <p className="pb-article-text">{outcomeText(item.status, t)}</p>
            <CTACluster>
              <Link className="pb-btn pb-btn-secondary" to="/feed">
                {t("prediction.cta.feed")}
              </Link>
              <Link className="pb-btn pb-btn-ghost" to="/tariffs">
                {t("prediction.cta.tariffs")}
              </Link>
            </CTACluster>
          </AppShellSection>
        </>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}
