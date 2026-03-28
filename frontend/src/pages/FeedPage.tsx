import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, CTACluster, SectionHeader, SegmentedTabs, SignalCardV3 } from "../components/ui";
import { api, type Prediction } from "../services/api";

type AccessFilter = "all" | "free" | "premium" | "vip";
type ModeFilter = "all" | "prematch" | "live";
type StatusFilter = "all" | "pending" | "won" | "lost" | "refund";
type RiskFilter = "all" | "low" | "medium" | "high";

type GroupedDay = {
  key: string;
  list: Prediction[];
};

const PREDICTIONS_LIMIT = 100;

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

function dayHeading(key: string, language: "ru" | "en", t: (key: string) => string) {
  if (key === "unknown") return t("common.noDate");

  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(date.getTime())) return t("common.noDate");

  const now = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - current.getTime()) / 86400000);
  if (diff === 0) return t("feed.day.today");
  if (diff === 1) return t("feed.day.tomorrow");
  if (diff === -1) return t("feed.day.yesterday");
  return target.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function dayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function teaser(value: string | null | undefined, fallback: string) {
  const source = (value || "").replace(/\s+/g, " ").trim();
  if (!source) return fallback;
  if (source.length <= 150) return source;
  return `${source.slice(0, 147).trim()}...`;
}

export function FeedPage() {
  const { t, language } = useI18n();

  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [access, setAccess] = useState<AccessFilter>("all");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    api
      .predictions({
        access_level: access === "all" ? undefined : access,
        mode: mode === "all" ? undefined : mode,
        status: status === "all" ? undefined : status,
        risk_level: risk === "all" ? undefined : risk,
        limit: PREDICTIONS_LIMIT,
      })
      .then((list) => {
        if (!alive) return;
        setItems(list);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setItems([]);
        setError(parseErrorMessage(e, ""));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [access, mode, risk, status, reloadKey]);

  const groups = useMemo<GroupedDay[]>(() => {
    const sorted = [...items].sort((a, b) => {
      const left = new Date(a.event_start_at).getTime();
      const right = new Date(b.event_start_at).getTime();
      const leftSafe = Number.isNaN(left) ? 0 : left;
      const rightSafe = Number.isNaN(right) ? 0 : right;
      return leftSafe - rightSafe;
    });
    const map = new Map<string, Prediction[]>();
    sorted.forEach((item) => {
      const key = dayKey(item.event_start_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });
    return Array.from(map.entries()).map(([key, list]) => ({ key, list }));
  }, [items]);

  const accessOptions = [
    { value: "all", label: t("common.all") },
    { value: "free", label: t("common.free") },
    { value: "premium", label: t("common.premium") },
    { value: "vip", label: t("common.vip") },
  ];

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

  const riskOptions = [
    { value: "all", label: t("common.all") },
    { value: "low", label: t("common.risk.low") },
    { value: "medium", label: t("common.risk.medium") },
    { value: "high", label: t("common.risk.high") },
  ];

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={t("feed.hero.title")}
          subtitle={t("feed.hero.subtitle")}
          action={
            <span className="pb-hint-chip">{items.length}</span>
          }
        />

        <div className="pb-filterbar">
          <div>
            <small>{t("feed.filter.access")}</small>
            <SegmentedTabs value={access} options={accessOptions} onChange={(next) => setAccess(next as AccessFilter)} />
          </div>
          <div>
            <small>{t("feed.filter.mode")}</small>
            <SegmentedTabs value={mode} options={modeOptions} onChange={(next) => setMode(next as ModeFilter)} />
          </div>
          <div>
            <small>{t("feed.filter.status")}</small>
            <SegmentedTabs value={status} options={statusOptions} onChange={(next) => setStatus(next as StatusFilter)} />
          </div>
          <div>
            <small>{t("feed.filter.risk")}</small>
            <SegmentedTabs value={risk} options={riskOptions} onChange={(next) => setRisk(next as RiskFilter)} />
          </div>
        </div>

        {loading ? <p className="pb-empty-state">{t("feed.loading")}</p> : null}
        {!loading && error ? (
          <div className="pb-error-state">
            <p>{error || t("feed.error")}</p>
            <CTACluster>
              <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
                {t("common.retry")}
              </button>
            </CTACluster>
          </div>
        ) : null}
        {!loading && !error && items.length === 0 ? <p className="pb-empty-state">{t("feed.empty")}</p> : null}

        <div className="pb-feed-groups">
          {groups.map((group) => (
            <section key={group.key}>
              <h3 className="pb-day-title">{dayHeading(group.key, language, t)}</h3>
              <div className="pb-feed-grid">
                {group.list.map((item, index) => {
                  const tags = [item.mode === "live" ? t("common.live") : t("common.prematch")];
                  if (item.status === "pending" && item.access_level === "vip") tags.push(t("feed.tag.strong"));
                  if (item.status === "pending" && item.odds >= 2.2) tags.push(t("feed.tag.hot"));
                  if (item.status === "pending" && index === 0) tags.push(t("feed.tag.pick"));

                  return (
                    <SignalCardV3
                      key={item.id}
                      to={`/feed/${item.id}`}
                      match={item.match_name}
                      league={item.league || t("feed.noLeague")}
                      sport={item.sport_type}
                      mode={item.mode === "live" ? t("common.live") : t("common.prematch")}
                      access={<AccessBadge level={item.access_level} label={accessLabel(item.access_level, t)} />}
                      status={statusLabel(item.status, t)}
                      kickoff={formatDate(item.event_start_at, language)}
                      odds={item.odds}
                      risk={riskLabel(item.risk_level, t)}
                      signal={item.signal_type}
                      teaser={teaser(item.short_description, t("feed.teaserFallback"))}
                      tags={tags}
                      hint={t("feed.detailsHint")}
                    />
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
