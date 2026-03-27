import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, ActivityBand, AppShellSection, CTACluster, MarketPulse, SectionHeader } from "../components/ui";
import { api, type Prediction } from "../services/api";

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

export function PredictionDetailsPage() {
  const { t, language } = useI18n();
  const { predictionId } = useParams<{ predictionId: string }>();

  const [item, setItem] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!predictionId) {
      setError(t("prediction.error"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    api
      .prediction(predictionId)
      .then(setItem)
      .catch((e: Error) => setError(e.message || t("prediction.error")))
      .finally(() => setLoading(false));
  }, [predictionId, t]);

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

          <MarketPulse label={t("prediction.section.context")} values={[58, 54, 56, 47, 50, 46, 42, 38, 34, 30]} tag={item.mode === "live" ? t("common.live") : t("common.prematch")} />

          <ActivityBand
            items={[
              { label: t("prediction.field.odds"), value: item.odds, tone: "accent" },
              { label: t("prediction.field.risk"), value: riskLabel(item.risk_level, t), tone: "warning" },
              { label: t("prediction.field.status"), value: statusLabel(item.status, t), tone: item.status === "won" ? "success" : "default" },
              { label: t("prediction.field.kickoff"), value: formatDate(item.event_start_at, language) },
            ]}
          />
        </section>
      ) : null}

      <AppShellSection>
        <SectionHeader title={t("prediction.section.snapshot")} />
        {loading ? <p className="pb-empty-state">{t("prediction.loading")}</p> : null}
        {!loading && error ? <p className="pb-error-state">{error}</p> : null}

        {!loading && item ? (
          <div className="pb-info-list">
            <div>
              <span>{t("prediction.field.sport")}</span>
              <strong>{item.sport_type}</strong>
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
              <span>{t("prediction.field.odds")}</span>
              <strong>{item.odds}</strong>
            </div>
            <div>
              <span>{t("prediction.field.risk")}</span>
              <strong>{riskLabel(item.risk_level, t)}</strong>
            </div>
            <div>
              <span>{t("prediction.field.access")}</span>
              <strong>{accessLabel(item.access_level, t)}</strong>
            </div>
            <div>
              <span>{t("prediction.field.status")}</span>
              <strong>{statusLabel(item.status, t)}</strong>
            </div>
            <div>
              <span>{t("prediction.field.mode")}</span>
              <strong>{item.mode === "live" ? t("common.live") : t("common.prematch")}</strong>
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
            <SectionHeader title={t("prediction.section.context")} />
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
