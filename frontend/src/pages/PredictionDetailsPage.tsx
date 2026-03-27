import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionActions, SectionHeader } from "../components/ui";
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

function riskLabel(value: Prediction["risk_level"], t: (key: string) => string): string {
  if (value === "low") return t("common.risk.low");
  if (value === "high") return t("common.risk.high");
  return t("common.risk.medium");
}

function accessLabel(level: Prediction["access_level"], t: (key: string) => string): string {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
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
        <HeroCard
          eyebrow={t("prediction.hero.title")}
          title={item.match_name}
          description={item.league || t("feed.noLeague")}
          right={<AccessBadge level={item.access_level} />}
        >
          <div className="feed-meta-row top">
            <span className="badge info">{item.mode === "live" ? t("common.live") : t("common.prematch")}</span>
            <span className={`badge ${item.status}`}>{statusLabel(item.status, t)}</span>
          </div>
        </HeroCard>
      ) : null}

      <AppShellSection>
        <SectionHeader title={t("prediction.breakdown")} />

        {loading ? <p className="muted-line">{t("prediction.loading")}</p> : null}
        {!loading && error ? <p className="error-msg">{error}</p> : null}

        {!loading && item ? (
          <>
            <div className="details-grid">
              <div className="info-row"><span>{t("prediction.sport")}</span><strong>{item.sport_type}</strong></div>
              <div className="info-row"><span>{t("prediction.kickoff")}</span><strong>{formatDate(item.event_start_at, language)}</strong></div>
              <div className="info-row"><span>{t("prediction.signal")}</span><strong>{item.signal_type}</strong></div>
              <div className="info-row"><span>{t("prediction.odds")}</span><strong>{item.odds}</strong></div>
              <div className="info-row"><span>{t("prediction.risk")}</span><strong>{riskLabel(item.risk_level, t)}</strong></div>
              <div className="info-row"><span>{t("prediction.access")}</span><strong>{accessLabel(item.access_level, t)}</strong></div>
            </div>

            <SectionHeader title={t("prediction.context")} />
            <div className="details-body">
              {t("prediction.context.text").replace("{mode}", item.mode === "live" ? t("common.live") : t("common.prematch"))}
            </div>

            <SectionHeader title={t("prediction.analysis")} />
            <div className="details-body">{item.short_description || t("prediction.analysis.empty")}</div>
          </>
        ) : null}

        <SectionActions compact>
          <Link className="btn secondary" to="/feed">{t("prediction.backFeed")}</Link>
          <Link className="btn ghost" to="/tariffs">{t("prediction.openTariffs")}</Link>
        </SectionActions>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
