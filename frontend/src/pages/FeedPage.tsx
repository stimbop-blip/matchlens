import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useI18n } from "../app/i18n";
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

type HeroTrendPoint = {
  x: number;
  y: number;
  score: number;
  signal: number;
  won: number;
  lost: number;
  refund: number;
  pending: number;
  status: Prediction["status"];
  label: string;
};

const PREDICTIONS_LIMIT = 100;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

function predictionTime(prediction: Prediction): number {
  const parsed = new Date(prediction.published_at || prediction.event_start_at).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function trendDelta(status: Prediction["status"]): number {
  if (status === "won") return 1;
  if (status === "lost") return -0.92;
  if (status === "refund") return 0.16;
  return 0.26;
}

function trendLabel(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

function smoothSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const pPrev = points[i - 2] || p0;
    const pNext = points[i + 1] || p1;

    const cp1x = p0.x + (p1.x - pPrev.x) / 6;
    const cp1y = p0.y + (p1.y - pPrev.y) / 6;
    const cp2x = p1.x - (pNext.x - p0.x) / 6;
    const cp2y = p1.y - (pNext.y - p0.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
}

function buildHeroTrend(items: Prediction[], language: "ru" | "en"): HeroTrendPoint[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => predictionTime(a) - predictionTime(b));
  const latest = sorted.slice(-12);
  const series = latest.length === 1 ? [latest[0], latest[0]] : latest;

  let cumulative = 0;
  let signal = 0;
  let won = 0;
  let lost = 0;
  let refund = 0;
  let pending = 0;

  const steps = series.map((item) => {
    if (item.status === "won") won += 1;
    if (item.status === "lost") lost += 1;
    if (item.status === "refund") refund += 1;
    if (item.status === "pending") pending += 1;

    cumulative += trendDelta(item.status);
    const oddsValue = Number(item.odds);
    const oddsBias = Number.isFinite(oddsValue) ? clampNumber((oddsValue - 1.6) * 0.2, -0.42, 0.56) : 0;
    const signalDelta =
      item.status === "won"
        ? 1.34 + oddsBias
        : item.status === "lost"
          ? -1.08 + oddsBias * 0.7
          : item.status === "refund"
            ? 0.26 + oddsBias * 0.55
            : 0.44 + oddsBias * 0.4;
    signal += signalDelta;

    return {
      status: item.status,
      score: cumulative,
      signal,
      won,
      lost,
      refund,
      pending,
      label: trendLabel(item.event_start_at || item.published_at || "", language),
    };
  });

  const minScore = Math.min(...steps.map((step) => step.score));
  const maxScore = Math.max(...steps.map((step) => step.score));
  const span = maxScore - minScore || 1;

  return steps.map((step, index) => ({
    x: steps.length === 1 ? 0 : index / (steps.length - 1),
    y: 1 - (step.score - minScore) / span,
    score: step.score,
    signal: step.signal,
    won: step.won,
    lost: step.lost,
    refund: step.refund,
    pending: step.pending,
    status: step.status,
    label: step.label,
  }));
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
  const lostCount = items.filter((item) => item.status === "lost").length;
  const refundCount = items.filter((item) => item.status === "refund").length;
  const hitRate = items.length > 0 ? Math.round((wonCount / items.length) * 100) : 0;
  const heroTrend = useMemo(() => buildHeroTrend(items, language), [items, language]);
  const chart = useMemo(() => {
    if (heroTrend.length === 0) return null;

    const width = 1000;
    const height = 308;
    const padX = 46;
    const lineTop = 24;
    const lineBottom = 184;
    const chartHeight = lineBottom - lineTop;
    const barsBaseY = 236;

    const source = heroTrend.map((point) => ({
      x: padX + point.x * (width - padX * 2),
      score: point.score,
      signal: point.signal,
      won: point.won,
      lost: point.lost,
      refund: point.refund,
      pending: point.pending,
      status: point.status,
      label: point.label,
    }));

    const scoreMin = Math.min(...source.map((point) => point.score));
    const scoreMax = Math.max(...source.map((point) => point.score));
    const scoreSpan = scoreMax - scoreMin || 1;
    const signalMin = Math.min(...source.map((point) => point.signal));
    const signalMax = Math.max(...source.map((point) => point.signal));
    const signalSpan = signalMax - signalMin || 1;
    const points = source.map((point) => ({
      ...point,
      y: lineTop + (1 - (point.score - scoreMin) / scoreSpan) * chartHeight,
      sy: lineTop + (1 - (point.signal - signalMin) / signalSpan) * chartHeight,
    }));

    const linePath = smoothSvgPath(points);
    const signalPath = smoothSvgPath(points.map((point) => ({ x: point.x, y: point.sy })));
    const areaBaseY = lineBottom + 10;
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${areaBaseY.toFixed(2)} L ${points[0].x.toFixed(2)} ${areaBaseY.toFixed(2)} Z`;

    const barWidth = clampNumber((width - padX * 2) / (points.length * 2.9), 8, 15);
    const bars = points.map((point, index) => {
      const previous = points[index - 1];
      const delta = index === 0 ? point.score : point.score - previous.score;
      const heightValue = clampNumber(Math.abs(delta) * 22, 5, 30);
      const positive = delta >= 0;
      return {
        x: point.x - barWidth / 2,
        y: positive ? barsBaseY - heightValue : barsBaseY,
        width: barWidth,
        height: heightValue,
        positive,
        status: point.status,
      };
    });

    const axisIndices = [0, 0.25, 0.5, 0.75, 1].map((part) => Math.round((points.length - 1) * part));
    const axisLabels = axisIndices.map((index) => points[index]?.label || "--");
    const gridY = [0, 0.33, 0.66, 1].map((part) => lineTop + part * (lineBottom - lineTop));

    const latestPoint = points[points.length - 1];
    const previousPoint = points[points.length - 2] || latestPoint;
    const latestSignal = Number(latestPoint.signal.toFixed(1));
    const trendShift = Number((latestPoint.score - points[0].score).toFixed(1));
    const momentum = Number((latestPoint.score - previousPoint.score).toFixed(2));
    const signalShift = Number((latestPoint.signal - points[0].signal).toFixed(1));
    const volatility = Number((bars.reduce((sum, bar) => sum + bar.height, 0) / (bars.length || 1)).toFixed(1));

    return {
      width,
      height,
      padX,
      lineTop,
      lineBottom,
      barsBaseY,
      points,
      bars,
      linePath,
      signalPath,
      areaPath,
      axisLabels,
      gridY,
      latestSignal,
      trendShift,
      momentum,
      signalShift,
      volatility,
    };
  }, [heroTrend]);

  const selectedPoint = chart ? chart.points[chart.points.length - 1] : null;

  return (
    <Layout>
      <div className="pb-screen pb-screen-feed">
        <HeroPanel eyebrow="Signal Desk" title={t("feed.hero.title")} subtitle={t("feed.hero.subtitle")} right={<span className="pb-feed-v4-total">{items.length}</span>}>
          <div className="pb-feed-v5-hero-scene" aria-hidden="true">
            {chart ? (
              <div className="pb-feed-v5-board">
                <div className="pb-feed-v5-head">
                  <div className="pb-feed-v5-legend">
                    <span>
                      <i className="curve" />
                      {language === "ru" ? "Кривая ROI" : "ROI curve"}
                    </span>
                    <span>
                      <i className="signal" />
                      {language === "ru" ? "Сигнал" : "Signal"}
                    </span>
                    <span>
                      <i className="bars" />
                      {language === "ru" ? "Волатильность" : "Volatility"}
                    </span>
                  </div>
                  <div className="pb-feed-v5-snapshot">
                    <article>
                      <small>{language === "ru" ? "Победы" : "Wins"}</small>
                      <strong>{wonCount}</strong>
                    </article>
                    <article>
                      <small>{language === "ru" ? "Пораж." : "Lost"}</small>
                      <strong>{lostCount}</strong>
                    </article>
                    <article>
                      <small>{language === "ru" ? "Точность" : "Hit rate"}</small>
                      <strong>{hitRate}%</strong>
                    </article>
                  </div>
                </div>

                <div className="pb-feed-v5-chart-main">
                  <div className="pb-feed-v5-plot-shell">
                    <motion.svg
                      className="pb-feed-v5-svg"
                      viewBox={`0 0 ${chart.width} ${chart.height}`}
                      preserveAspectRatio="none"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.42, ease: "easeOut" }}
                    >
                      <defs>
                        <linearGradient id="pbFeedV5Area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(46, 211, 255, 0.72)" />
                          <stop offset="48%" stopColor="rgba(55, 140, 255, 0.34)" />
                          <stop offset="100%" stopColor="rgba(55, 140, 255, 0.04)" />
                        </linearGradient>
                        <linearGradient id="pbFeedV5MainLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(92, 247, 221, 0.94)" />
                          <stop offset="100%" stopColor="rgba(53, 150, 255, 0.98)" />
                        </linearGradient>
                        <linearGradient id="pbFeedV5SignalLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(86, 248, 205, 0.85)" />
                          <stop offset="100%" stopColor="rgba(46, 211, 255, 0.95)" />
                        </linearGradient>
                        <linearGradient id="pbFeedV5BloomA" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgba(97, 233, 255, 0.54)" />
                          <stop offset="100%" stopColor="rgba(97, 233, 255, 0)" />
                        </linearGradient>
                        <linearGradient id="pbFeedV5BloomB" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgba(87, 255, 196, 0.46)" />
                          <stop offset="100%" stopColor="rgba(87, 255, 196, 0)" />
                        </linearGradient>
                      </defs>

                      {chart.gridY.map((line, index) => (
                        <line key={index} x1={chart.padX} y1={line} x2={chart.width - chart.padX} y2={line} className="pb-feed-v5-gridline" />
                      ))}

                      <ellipse cx={chart.points[Math.floor((chart.points.length - 1) * 0.2)]?.x || chart.padX} cy={chart.barsBaseY - 34} rx="98" ry="58" fill="url(#pbFeedV5BloomA)" />
                      <ellipse cx={chart.points[Math.floor((chart.points.length - 1) * 0.58)]?.x || chart.width * 0.5} cy={chart.barsBaseY - 74} rx="108" ry="76" fill="url(#pbFeedV5BloomB)" />

                      {chart.bars.map((bar, index) => (
                        <rect
                          key={`${index}-${bar.status}`}
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          rx="3"
                          className={`pb-feed-v5-bar ${bar.positive ? "up" : "down"} ${bar.status}`}
                        />
                      ))}

                      <motion.path
                        key={`area-${chart.areaPath}`}
                        d={chart.areaPath}
                        className="pb-feed-v5-area"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                      <motion.path
                        key={`signal-${chart.signalPath}`}
                        d={chart.signalPath}
                        className="pb-feed-v5-line-signal"
                        initial={{ pathLength: 0, opacity: 0.18 }}
                        animate={{ pathLength: 1, opacity: 0.9 }}
                        transition={{ duration: 1.06, ease: "easeOut" }}
                      />
                      <motion.path
                        key={`line-${chart.linePath}`}
                        d={chart.linePath}
                        className="pb-feed-v5-line-main"
                        initial={{ pathLength: 0, opacity: 0.24 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.18, ease: "easeOut", delay: 0.08 }}
                      />

                      {selectedPoint ? <line x1={selectedPoint.x} y1={chart.lineTop} x2={selectedPoint.x} y2={chart.barsBaseY + 20} className="pb-feed-v5-cursor-line" /> : null}

                      {chart.points.map((point, index) => {
                        const isSelectedPoint = index === chart.points.length - 1;
                        return (
                          <g key={`${index}-${point.label}`}>
                            {isSelectedPoint ? (
                              <>
                                <motion.circle
                                  cx={point.x}
                                  cy={point.y}
                                  r={9}
                                  className="pb-feed-v5-point-pulse"
                                  initial={{ opacity: 0.18, r: 9 }}
                                  animate={{ opacity: [0.45, 0.08, 0.45], r: [9, 17, 9] }}
                                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.circle
                                  cx={point.x}
                                  cy={point.y}
                                  r={14}
                                  className="pb-feed-v5-point-pulse soft"
                                  initial={{ opacity: 0.08, r: 13 }}
                                  animate={{ opacity: [0.2, 0, 0.2], r: [13, 21, 13] }}
                                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.22 }}
                                />
                              </>
                            ) : null}
                            <circle cx={point.x} cy={point.sy} r={4.4} className="pb-feed-v5-point-signal" />
                            <circle cx={point.x} cy={point.y} r={isSelectedPoint ? 8.2 : 7.2} className={`pb-feed-v5-point-shell ${isSelectedPoint ? "active" : ""}`} />
                            <circle cx={point.x} cy={point.y} r={isSelectedPoint ? 5.5 : 4.4} className={`pb-feed-v5-point ${point.status} ${isSelectedPoint ? "active" : ""}`} />
                            <circle cx={point.x} cy={point.y} r={2} className="pb-feed-v5-point-core" />
                          </g>
                        );
                      })}
                    </motion.svg>

                    {selectedPoint ? (
                      <div
                        className={`pb-feed-v5-tooltip ${selectedPoint.status} ${(selectedPoint.x / chart.width) > 0.62 ? "right" : "left"}`}
                        style={{
                          left: `${clampNumber((selectedPoint.x / chart.width) * 100, 12, 88)}%`,
                          top: `${clampNumber((selectedPoint.y / chart.height) * 100 - 7, 7, 68)}%`,
                        }}
                      >
                        <small>{selectedPoint.label}</small>
                        <strong>{statusLabel(selectedPoint.status, t)}</strong>
                        <span>
                          ROI {selectedPoint.score > 0 ? `+${selectedPoint.score.toFixed(1)}` : selectedPoint.score.toFixed(1)} · SIG {selectedPoint.signal > 0 ? `+${selectedPoint.signal.toFixed(1)}` : selectedPoint.signal.toFixed(1)}
                        </span>
                      </div>
                    ) : null}

                    <div className={chart.momentum >= 0 ? "pb-feed-v5-float up" : "pb-feed-v5-float down"}>
                      <small>{language === "ru" ? "Импульс" : "Momentum"}</small>
                      <strong>{chart.momentum > 0 ? `+${chart.momentum}` : chart.momentum}</strong>
                    </div>
                  </div>

                  <div className="pb-feed-v5-kpi-rail">
                    <article className={chart.trendShift >= 0 ? "up" : "down"}>
                      <small>{language === "ru" ? "Тренд" : "Trend"}</small>
                      <strong>{chart.trendShift > 0 ? `+${chart.trendShift}` : chart.trendShift}</strong>
                    </article>
                    <article className={chart.latestSignal >= 0 ? "up" : "down"}>
                      <small>{language === "ru" ? "Сигнал" : "Signal"}</small>
                      <strong>{chart.latestSignal > 0 ? `+${chart.latestSignal}` : chart.latestSignal}</strong>
                    </article>
                    <article>
                      <small>{language === "ru" ? "Волатильность" : "Volatility"}</small>
                      <strong>{chart.volatility}</strong>
                    </article>
                    <article>
                      <small>{language === "ru" ? "Live" : "Live"}</small>
                      <strong>{liveCount}</strong>
                    </article>
                  </div>
                </div>

                <div className="pb-feed-v5-axis">
                  {chart.axisLabels.map((label, index) => (
                    <span key={`${label}-${index}`}>{label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pb-feed-v5-empty">{language === "ru" ? "Нет данных для графика" : "No data for chart"}</div>
            )}
          </div>

        <div className="pb-feed-v4-hero-status">
          <span className="won">
            {t("feed.status.won")}: <b>{wonCount}</b>
          </span>
          <span className="lost">
            {t("feed.status.lost")}: <b>{lostCount}</b>
          </span>
          <span className="refund">
            {t("feed.status.refund")}: <b>{refundCount}</b>
          </span>
          <span className="pending">
            {t("feed.status.pending")}: <b>{pendingCount}</b>
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
                              highConfidence={item.risk_level === "low"}
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
                        betScreenshot={item.bet_screenshot}
                        resultScreenshot={item.result_screenshot}
                        highConfidence={item.risk_level === "low"}
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
