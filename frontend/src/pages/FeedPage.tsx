import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { SignalCard } from "../components/premium/SignalCard";
import { SkeletonBlock } from "../components/ui";
import { api, type Prediction } from "../services/api";
import { triggerHaptic } from "../services/telegram";

type QuickFilter = "all" | "live" | "soon" | "won" | "vip";

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
  return target.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long" });
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

type GroupedDay = { key: string; list: Prediction[] };

export function FeedPage({ useThreeCards = false }: { useThreeCards?: boolean } = {}) {
  const { t, language } = useI18n();

  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api
      .predictions({ limit: PREDICTIONS_LIMIT })
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
  }, [reloadKey]);

  // Сортировка: свежие сверху
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const left = new Date(a.published_at || a.event_start_at).getTime();
      const right = new Date(b.published_at || b.event_start_at).getTime();
      const leftSafe = Number.isNaN(left) ? 0 : left;
      const rightSafe = Number.isNaN(right) ? 0 : right;
      return rightSafe - leftSafe;
    });
  }, [items]);

  const now = Date.now();
  const ONE_DAY = 86400000;

  // Live-сигналы (для горизонтальной полосы)
  const liveItems = useMemo(() => sortedItems.filter((item) => item.mode === "live" && item.status === "pending"), [sortedItems]);

  // Фильтрация по быстрому фильтру + поиску
  const filtered = useMemo(() => {
    let list = sortedItems;
    if (filter === "live") {
      list = list.filter((item) => item.mode === "live" && item.status === "pending");
    } else if (filter === "soon") {
      list = list.filter((item) => {
        const ts = new Date(item.event_start_at).getTime();
        return item.mode !== "live" && item.status === "pending" && ts > now && ts - now < ONE_DAY;
      });
    } else if (filter === "won") {
      list = list.filter((item) => item.status === "won");
    } else if (filter === "vip") {
      list = list.filter((item) => item.access_level === "premium" || item.access_level === "vip");
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) =>
        `${item.match_name} ${item.league || ""} ${item.sport_type} ${item.signal_type}`
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [sortedItems, filter, query, now]);

  // Группировка по дням
  const groups = useMemo<GroupedDay[]>(() => {
    const map = new Map<string, Prediction[]>();
    filtered.forEach((item) => {
      const key = dayKey(item.event_start_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });
    return Array.from(map.entries()).map(([key, list]) => ({ key, list }));
  }, [filtered]);

  const liveCount = liveItems.length;
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const wonCount = items.filter((item) => item.status === "won").length;
  const hitRate = items.length > 0 ? Math.round((wonCount / items.length) * 100) : 0;

  const quickFilters: Array<{ value: QuickFilter; label: string; count?: number }> = [
    { value: "all", label: t("common.all"), count: items.length },
    { value: "live", label: t("common.live"), count: liveCount },
    { value: "soon", label: t("feed.quick.soon") },
    { value: "won", label: t("feed.quick.won") },
    { value: "vip", label: "VIP" },
  ];

  return (
    <Layout>
      <div className="pb-screen pb-screen-feed">
        {/* Компактная полоска статистики + кнопка «Статистика» */}
        <div className="pb-feed-topbar">
          <div className="pb-feed-stats-chips">
            <span className="pb-feed-chip"><strong>{hitRate}%</strong>{t("feed.quick.hit")}</span>
            {liveCount > 0 ? (
              <span className="pb-feed-chip live"><span className="pb-feed-live-dot" />{liveCount} {t("feed.quick.liveShort")}</span>
            ) : null}
            <span className="pb-feed-chip">{pendingCount} {t("feed.quick.pending")}</span>
          </div>
          <Link to="/stats" className="pb-feed-stats-btn" onClick={() => triggerHaptic("selection")}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("feed.quick.stats")}
          </Link>
        </div>

        {/* Поиск по матчам */}
        <div className="pb-feed-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("feed.search.placeholder")}
          />
          {query ? (
            <button type="button" className="pb-feed-search-clear" onClick={() => setQuery("")} aria-label="clear">×</button>
          ) : null}
        </div>

        {/* Live-полоса (горизонтальный скролл живых матчей) */}
        {liveItems.length > 0 ? (
          <section className="pb-feed-live-rail">
            <div className="pb-feed-live-head">
              <span className="pb-feed-live-pulse" />
              <span>{t("feed.live.railTitle")}</span>
            </div>
            <div className="pb-feed-live-scroller">
              {liveItems.map((item) => (
                <Link key={item.id} className="pb-feed-live-card" to={`/feed/${item.id}`} onClick={() => triggerHaptic("selection")}>
                  <div className="pb-feed-live-card-top">
                    <span className="pb-feed-live-sport">{item.sport_type}</span>
                    <span className="pb-feed-live-kf">{item.odds.toFixed(2)}</span>
                  </div>
                  <strong className="pb-feed-live-match">{item.match_name}</strong>
                  <span className="pb-feed-live-signal">{item.signal_type}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Быстрые фильтры (сегменты) */}
        <div className="pb-feed-segments" role="tablist">
          {quickFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              className={`pb-feed-segment ${filter === item.value ? "active" : ""}`}
              onClick={() => {
                triggerHaptic("selection");
                setFilter(item.value);
              }}
            >
              {item.label}
              {typeof item.count === "number" && item.count > 0 ? <span className="pb-feed-segment-count">{item.count}</span> : null}
            </button>
          ))}
        </div>

        {/* Загрузка */}
        {loading ? (
          <div className="pb-feed-skeleton-grid">
            {[0, 1, 2].map((i) => (
              <article key={i} className="pb-feed-skeleton-card">
                <SkeletonBlock className="w-70" />
                <SkeletonBlock className="w-40" />
                <SkeletonBlock className="h-72" />
              </article>
            ))}
          </div>
        ) : null}

        {/* Ошибка */}
        {!loading && error ? (
          <div className="pb-error-state">
            <p>{error || t("feed.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        ) : null}

        {/* Пусто */}
        {!loading && !error && filtered.length === 0 ? (
          <p className="pb-empty-state">{query ? t("feed.search.empty") : t("feed.empty")}</p>
        ) : null}

        {/* Лента по дням */}
        {!loading && !error && filtered.length > 0 ? (
          <div className="pb-feed-groups">
            {groups.map((group) => (
              <section key={group.key} className="pb-feed-day">
                <h3 className="pb-feed-day-title">{dayHeading(group.key, language, t)}</h3>
                <div className="pb-feed-grid">
                  {group.list.map((item) => (
                    <SignalCard
                      key={item.id}
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
                      highConfidence={item.risk_level === "low"}
                    />
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
