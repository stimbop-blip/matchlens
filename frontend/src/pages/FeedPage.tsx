import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, CardFooterActions, SectionHeader, SegmentedTabs } from "../components/ui";
import { api, type Prediction } from "../services/api";

type ModeFilter = "all" | "prematch" | "live";
type StatusFilter = "all" | "pending" | "won" | "lost" | "refund";

function sportEmoji(sport: string): string {
  const normalized = sport.toLowerCase();
  if (normalized.includes("football") || normalized.includes("soccer")) return "⚽";
  if (normalized.includes("basket")) return "🏀";
  if (normalized.includes("tennis")) return "🎾";
  if (normalized.includes("hockey")) return "🏒";
  return "🎯";
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

function teaser(value: string | null | undefined, fallback: string): string {
  const source = (value || "").replace(/\s+/g, " ").trim();
  if (!source) return fallback;
  if (source.length <= 110) return source;
  return `${source.slice(0, 107).trim()}...`;
}

function dayHeading(date: Date, language: "ru" | "en", t: (key: string) => string): string {
  const now = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000);
  if (diffDays === 0) return t("feed.day.today");
  if (diffDays === 1) return t("feed.day.tomorrow");
  if (diffDays === -1) return t("feed.day.yesterday");
  return target.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function markList(item: Prediction, t: (key: string) => string): string[] {
  const list: string[] = [];
  if (item.mode === "live") list.push(t("common.live"));
  if (item.access_level === "vip" && item.status === "pending") list.push(t("feed.mark.strong"));
  if (item.odds >= 2.2 && item.status === "pending") list.push(t("feed.mark.hot"));
  return list.slice(0, 2);
}

function statusLabel(status: Prediction["status"], t: (key: string) => string): string {
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

export function FeedPage() {
  const { t, language } = useI18n();

  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .predictions({ mode: mode === "all" ? undefined : mode, status: status === "all" ? undefined : status })
      .then(setItems)
      .catch((e: Error) => setError(e.message || t("prediction.error")))
      .finally(() => setLoading(false));
  }, [mode, status, t]);

  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(a.event_start_at).getTime() - new Date(b.event_start_at).getTime());
    const map = new Map<string, Prediction[]>();
    sorted.forEach((item) => {
      const key = dayHeading(new Date(item.event_start_at), language, t);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });
    return Array.from(map.entries());
  }, [items, language, t]);

  const modeOptions = [
    { value: "all", label: t("common.all") },
    { value: "prematch", label: t("common.prematch") },
    { value: "live", label: t("common.live") },
  ];

  const statusOptions = [
    { value: "all", label: t("common.all") },
    { value: "pending", label: t("feed.status.pending") },
    { value: "won", label: t("feed.status.won") },
    { value: "lost", label: t("feed.status.lost") },
    { value: "refund", label: t("feed.status.refund") },
  ];

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader title={t("feed.title")} subtitle={t("feed.subtitle")} action={<span className="hint-chip">{items.length}</span>} />

        <div className="filter-stack sticky-filters">
          <SegmentedTabs value={mode} options={modeOptions} onChange={(next) => setMode(next as ModeFilter)} />
          <SegmentedTabs value={status} options={statusOptions} onChange={(next) => setStatus(next as StatusFilter)} />
        </div>

        {loading ? <p className="muted-line">{t("feed.loading")}</p> : null}
        {error ? <p className="error-msg">{error}</p> : null}
        {!loading && !error && items.length === 0 ? <p className="empty-state">{t("feed.empty")}</p> : null}

        <div className="feed-list premium-feed">
          {groups.map(([title, predictions]) => (
            <section key={title} className="feed-day-block">
              <h3 className="feed-day-title">{title}</h3>
              <div className="feed-cards">
                {predictions.map((item) => {
                  const marks = markList(item, t);
                  return (
                    <article key={item.id} className="feed-card signal-card">
                      <div className="feed-card-head">
                        <div>
                          <Link className="feed-card-main-link" to={`/feed/${item.id}`}>
                            <strong>{sportEmoji(item.sport_type)} {item.match_name}</strong>
                          </Link>
                          <p>{item.league || t("feed.noLeague")}</p>
                        </div>
                        <AccessBadge level={item.access_level} />
                      </div>

                      <div className="feed-meta-row top">
                        <span className="badge info">{item.mode === "live" ? t("common.live") : t("common.prematch")}</span>
                        <span>{formatDate(item.event_start_at, language)}</span>
                        <span className={`badge ${item.status}`}>{statusLabel(item.status, t)}</span>
                      </div>

                      {marks.length > 0 ? (
                        <div className="feed-marks-row">
                          {marks.map((mark) => (
                            <span key={mark} className="mark-pill">{mark}</span>
                          ))}
                        </div>
                      ) : null}

                      <div className="feed-signal-grid">
                        <div>
                          <small>{t("feed.signal")}</small>
                          <p>{item.signal_type}</p>
                        </div>
                        <div>
                          <small>{t("feed.odds")}</small>
                          <p className="value-strong">{item.odds}</p>
                        </div>
                        <div>
                          <small>{t("feed.risk")}</small>
                          <p>{riskLabel(item.risk_level, t)}</p>
                        </div>
                      </div>

                      <p className="feed-note">{teaser(item.short_description, t("feed.comment.empty"))}</p>

                      <CardFooterActions>
                        <span className="muted-line">{item.sport_type}</span>
                        <Link className="feed-open-link" to={`/feed/${item.id}`}>
                          {t("feed.details")}
                        </Link>
                      </CardFooterActions>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
