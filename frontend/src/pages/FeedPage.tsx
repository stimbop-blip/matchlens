import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useI18n } from "../app/i18n";
import { sportCoverDataUri } from "../app/sportArt";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { HeroPanel } from "../components/premium/HeroPanel";
import { SignalCard } from "../components/premium/SignalCard";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
import { SkeletonBlock } from "../components/ui";
import { api, type Prediction } from "../services/api";
import { triggerHaptic } from "../services/telegram";

const SignalCard3D = lazy(() => import("../components/three/SignalCard3D").then((module) => ({ default: module.SignalCard3D })));

type AccessFilter = "all" | "free" | "premium" | "vip";
type ModeFilter = "all" | "live" | "prematch";
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

export function FeedPage({ useThreeCards = false }: { useThreeCards?: boolean } = {}) {
  const { t, language } = useI18n();

  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [access, setAccess] = useState<AccessFilter>("all");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const onFilterSelect = <T,>(setter: (value: T) => void, value: T) => {
    triggerHaptic("selection");
    setter(value);
  };

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
      const left = new Date(a.published_at || a.event_start_at).getTime();
      const right = new Date(b.published_at || b.event_start_at).getTime();
      const leftSafe = Number.isNaN(left) ? 0 : left;
      const rightSafe = Number.isNaN(right) ? 0 : right;
      return rightSafe - leftSafe;
    });
    const map = new Map<string, Prediction[]>();
    sorted.forEach((item) => {
      const key = dayKey(item.event_start_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });
    return Array.from(map.entries()).map(([key, list]) => ({ key, list }));
  }, [items]);

  const modeOptions: Array<{ value: ModeFilter; label: string }> = [
    { value: "all", label: t("common.all") },
    { value: "live", label: t("common.live") },
    { value: "prematch", label: t("common.prematch") },
  ];

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: t("common.all") },
    { value: "pending", label: t("feed.status.pending") },
    { value: "won", label: t("feed.status.won") },
    { value: "lost", label: t("feed.status.lost") },
    { value: "refund", label: t("feed.status.refund") },
  ];

  const accessOptions: Array<{ value: AccessFilter; label: string }> = [
    { value: "all", label: t("common.all") },
    { value: "free", label: t("common.free") },
    { value: "premium", label: t("common.premium") },
    { value: "vip", label: t("common.vip") },
  ];

  const riskOptions: Array<{ value: RiskFilter; label: string }> = [
    { value: "all", label: t("common.all") },
    { value: "low", label: t("common.risk.low") },
    { value: "medium", label: t("common.risk.medium") },
    { value: "high", label: t("common.risk.high") },
  ];

  const liveCount = items.filter((item) => item.mode === "live").length;
  const premiumCount = items.filter((item) => item.access_level === "premium" || item.access_level === "vip").length;
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const wonCount = items.filter((item) => item.status === "won").length;
  const hitRate = items.length > 0 ? Math.round((wonCount / items.length) * 100) : 0;
  const heroBackdrop = useMemo(() => {
    const primarySport = items.find((item) => item.status === "pending")?.sport_type || items[0]?.sport_type || "football";
    return sportCoverDataUri(primarySport, "landscape");
  }, [items]);

  return (
    <Layout>
      <div className="pb-screen pb-screen-feed">
        <HeroPanel eyebrow="Signal Desk" title={t("feed.hero.title")} subtitle={t("feed.hero.subtitle")} right={<span className="pb-feed-v4-total">{items.length}</span>}>
        <div className="pb-feed-v4-hero-scene" aria-hidden="true">
          <img className="pb-feed-v4-hero-backdrop" src={heroBackdrop} alt="" loading="lazy" />
          <span className="pb-feed-v4-hero-overlay" />
          <span className="pb-feed-v4-hero-gloss" />
          <div className="pb-feed-v4-hero-bars">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="pb-feed-v4-hero-mark">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="pb-feed-v4-hero-status">
          <span>
            {t("feed.status.won")}: <b>{wonCount}</b>
          </span>
          <span>
            {t("feed.status.pending")}: <b>{pendingCount}</b>
          </span>
          <span>
            {t("home.performance.hit")}: <b>{hitRate}%</b>
          </span>
        </div>

        <div className="pb-feed-v4-kpi">
          <PremiumKpi label={t("common.live")} value={liveCount} tone="accent" />
          <PremiumKpi label={t("common.premium")} value={premiumCount} tone="vip" />
          <PremiumKpi label={t("feed.status.pending")} value={pendingCount} />
        </div>
      </HeroPanel>

      <section className="pb-premium-panel pb-feed-v4-sticky pb-reveal">
        <div className="pb-feed-v4-filter-stack">
          <div className="pb-feed-v4-pill-row primary">
            {modeOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={item.value === mode ? "pb-feed-v4-pill active" : "pb-feed-v4-pill"}
                onClick={() => onFilterSelect(setMode, item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pb-feed-v4-pill-row secondary">
            {statusOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={item.value === status ? "pb-feed-v4-pill soft active" : "pb-feed-v4-pill soft"}
                onClick={() => onFilterSelect(setStatus, item.value)}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className={showAdvancedFilters ? "pb-feed-v4-pill subtle active" : "pb-feed-v4-pill subtle"}
              onClick={() => {
                triggerHaptic("selection");
                setShowAdvancedFilters((prev) => !prev);
              }}
            >
              {showAdvancedFilters ? t("feed.filter.advanced.hide") : t("feed.filter.advanced.show")}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showAdvancedFilters ? (
              <motion.div
                className="pb-feed-v4-advanced-sheet"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div>
                  <small>{t("feed.filter.access")}</small>
                  <div className="pb-feed-v4-pill-row">
                    {accessOptions.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={item.value === access ? "pb-feed-v4-pill soft active" : "pb-feed-v4-pill soft"}
                        onClick={() => onFilterSelect(setAccess, item.value)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <small>{t("feed.filter.risk")}</small>
                  <div className="pb-feed-v4-pill-row">
                    {riskOptions.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={item.value === risk ? "pb-feed-v4-pill subtle active" : "pb-feed-v4-pill subtle"}
                        onClick={() => onFilterSelect(setRisk, item.value)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      {loading ? (
        <section className="pb-premium-panel pb-feed-v4-loading pb-reveal">
          <AIScanningLoader compact />
          <div className="pb-feed-v4-skeleton-grid" aria-hidden="true">
            <article className="pb-feed-v4-skeleton-card">
              <SkeletonBlock className="w-70" />
              <SkeletonBlock className="w-40" />
              <SkeletonBlock className="h-72" />
            </article>
            <article className="pb-feed-v4-skeleton-card">
              <SkeletonBlock className="w-65" />
              <SkeletonBlock className="w-35" />
              <SkeletonBlock className="h-72" />
            </article>
            <article className="pb-feed-v4-skeleton-card">
              <SkeletonBlock className="w-60" />
              <SkeletonBlock className="w-45" />
              <SkeletonBlock className="h-72" />
            </article>
          </div>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="pb-premium-panel pb-reveal">
          <div className="pb-error-state">
            <p>{error || t("feed.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <section className="pb-premium-panel pb-reveal">
          <p className="pb-empty-state">{t("feed.empty")}</p>
        </section>
      ) : null}

      {!loading && !error ? (
        <div className="pb-feed-v4-groups pb-reveal">
          {groups.map((group) => (
            <section key={group.key} className="pb-feed-v4-day-group">
              <h3>{dayHeading(group.key, language, t)}</h3>
              <div className="pb-feed-v4-grid pb-feed-v4-grid-3d">
                {group.list.map((item) => (
                  <div key={item.id} className="pb-feed-v4-card-depth">
                    {useThreeCards ? (
                        <ErrorBoundary fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                          <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                            <SignalCard3D
                              to={`/feed/${item.id}`}
                              title={item.match_name}
                              league={item.league || t("feed.noLeague")}
                              sport={item.sport_type}
                              mode={item.mode === "live" ? t("common.live") : t("common.prematch")}
                              kickoff={formatDate(item.event_start_at, language)}
                              signal={item.signal_type}
                              odds={item.odds}
                              oddsLabel={t("feed.label.odds")}
                              risk={riskLabel(item.risk_level, t)}
                              status={item.status}
                              statusLabel={statusLabel(item.status, t)}
                              accessLabel={accessLabel(item.access_level, t)}
                              note={teaser(item.short_description, t("feed.teaserFallback"))}
                              language={language}
                              betScreenshot={item.bet_screenshot}
                              resultScreenshot={item.result_screenshot}
                            />
                          </Suspense>
                        </ErrorBoundary>
                    ) : (
                      <SignalCard
                        to={`/feed/${item.id}`}
                        title={item.match_name}
                        league={item.league || t("feed.noLeague")}
                        sport={item.sport_type}
                        mode={item.mode === "live" ? t("common.live") : t("common.prematch")}
                        kickoff={formatDate(item.event_start_at, language)}
                        signal={item.signal_type}
                        odds={item.odds}
                        oddsLabel={t("feed.label.odds")}
                        risk={riskLabel(item.risk_level, t)}
                        status={item.status}
                        statusLabel={statusLabel(item.status, t)}
                        accessLabel={accessLabel(item.access_level, t)}
                        note={teaser(item.short_description, t("feed.teaserFallback"))}
                        language={language}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

        <AppDisclaimer />
      </div>
    </Layout>
  );
}
