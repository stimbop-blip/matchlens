import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ReferenceArea, Cell, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

import type { Prediction } from "../../services/api";
import { useTheme } from "../../app/language";

type SignalPerformanceChartProps = {
  items: Prediction[];
  language: "ru" | "en";
};

type AccessLevel = Prediction["access_level"];
type Status = Prediction["status"];

const ACCESS_COLOR: Record<AccessLevel, string> = {
  free: "#67e8f9",
  premium: "#fbbf24",
  vip: "#a78bfa",
};

const ACCESS_GRADIENT: Record<AccessLevel, [string, string]> = {
  free: ["#67e8f9", "#0891b2"],
  premium: ["#fbbf24", "#d97706"],
  vip: ["#a78bfa", "#7c3aed"],
};

const STATUS_COLOR: Record<Status, string> = {
  won: "#34d399",
  lost: "#f87171",
  refund: "#fbbf24",
  pending: "#38bdf8",
};

// Палитры под темы
const THEME = {
  dark: {
    bg: "linear-gradient(165deg, #0b1424 0%, #08111f 60%, #0a1626 100%)",
    border: "rgba(56, 99, 147, 0.4)",
    shadow: "0 16px 40px rgba(3, 8, 18, 0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
    text: "#f8fbff",
    textMuted: "#8ca4c2",
    textDim: "#6e86a4",
    subBg: "rgba(10, 23, 41, 0.5)",
    subBorder: "rgba(90, 137, 190, 0.3)",
    tooltipBg: "rgba(15, 28, 48, 0.97)",
    tooltipBorder: "rgba(105, 151, 207, 0.4)",
    tooltipText: "#e4edf8",
    grid: "rgba(92, 128, 170, 0.13)",
    refLine: "rgba(148, 187, 230, 0.14)",
    axisText: "#60789a",
    dotInner: "#0a1428",
    accent: "#22d3ee",
    accentText: "#67e8f9",
    tierLabel: "#e9f3ff",
    forecastArea: "rgba(167, 139, 250, 0.07)",
    accentColor: "#22d3ee",
  },
  light: {
    bg: "linear-gradient(165deg, #ffffff 0%, #f4f7fc 60%, #ffffff 100%)",
    border: "rgba(120, 145, 180, 0.25)",
    shadow: "0 14px 34px rgba(30, 50, 90, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
    text: "#0f1729",
    textMuted: "#5a6b8c",
    textDim: "#94a3b8",
    subBg: "rgba(248, 250, 252, 0.8)",
    subBorder: "rgba(120, 145, 180, 0.22)",
    tooltipBg: "rgba(255, 255, 255, 0.98)",
    tooltipBorder: "rgba(80, 120, 180, 0.3)",
    tooltipText: "#0f1729",
    grid: "rgba(120, 145, 180, 0.15)",
    refLine: "rgba(120, 145, 180, 0.25)",
    axisText: "#64748b",
    dotInner: "#ffffff",
    accent: "#0891b2",
    accentText: "#0891b2",
    tierLabel: "#0f1729",
    forecastArea: "rgba(124, 58, 237, 0.06)",
    accentColor: "#0891b2",
  },
};

function eventTime(item: Prediction): number {
  const ts = new Date(item.published_at || item.event_start_at).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function shortDay(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", { day: "2-digit", month: "2-digit" });
}

function accessLabel(level: AccessLevel, language: "ru" | "en"): string {
  if (level === "premium") return "Premium";
  if (level === "vip") return "VIP";
  return "Free";
}

function statusLabel(status: Status, language: "ru" | "en"): string {
  if (language === "ru") {
    if (status === "won") return "Победа";
    if (status === "lost") return "Поражение";
    if (status === "refund") return "Возврат";
    return "Ожидание";
  }
  if (status === "won") return "Win";
  if (status === "lost") return "Lost";
  if (status === "refund") return "Refund";
  return "Pending";
}

function computeTierStats(items: Prediction[], level: AccessLevel) {
  const subset = items.filter((item) => item.access_level === level);
  const won = subset.filter((item) => item.status === "won").length;
  const lost = subset.filter((item) => item.status === "lost").length;
  const refund = subset.filter((item) => item.status === "refund").length;
  const settled = won + lost + refund;
  const hitRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
  return { count: subset.length, hitRate, won, lost, refund };
}

function getRank(hitRate: number, total: number): { name: string; color: string; icon: string; next: number | null; min: number } {
  if (total < 5) return { name: "Newcomer", color: "#6e86a4", icon: "🎯", next: 5, min: 0 };
  if (hitRate >= 80) return { name: "Platinum", color: "#a78bfa", icon: "💎", next: null, min: 80 };
  if (hitRate >= 65) return { name: "Gold", color: "#fbbf24", icon: "🥇", next: 80, min: 65 };
  if (hitRate >= 50) return { name: "Silver", color: "#94a3b8", icon: "🥈", next: 65, min: 50 };
  return { name: "Bronze", color: "#d97706", icon: "🥉", next: 50, min: 0 };
}

function getWinStreak(items: Prediction[]): number {
  const sorted = [...items].sort((a, b) => eventTime(b) - eventTime(a));
  let streak = 0;
  for (const item of sorted) {
    if (item.status === "won") streak += 1;
    else if (item.status === "lost") break;
  }
  return streak;
}

type ViewMode = "trend" | "bars";

export function SignalPerformanceChart({ items, language }: SignalPerformanceChartProps) {
  const { theme } = useTheme();
  const c = THEME[theme === "light" ? "light" : "dark"];

  const [viewMode, setViewMode] = useState<ViewMode>("trend");
  const [hoveredTier, setHoveredTier] = useState<AccessLevel | null>(null);

  const stats = useMemo(() => {
    const won = items.filter((item) => item.status === "won").length;
    const lost = items.filter((item) => item.status === "lost").length;
    const refund = items.filter((item) => item.status === "refund").length;
    const pending = items.filter((item) => item.status === "pending").length;
    const settled = won + lost + refund;
    const hitRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
    const roi = settled > 0 ? Math.round(((won * 0.85 - lost) / settled) * 100) : 0;
    const streak = getWinStreak(items);
    return {
      won, lost, refund, pending,
      total: items.length, settled, hitRate, roi, streak,
      free: computeTierStats(items, "free"),
      premium: computeTierStats(items, "premium"),
      vip: computeTierStats(items, "vip"),
    };
  }, [items]);

  const rank = useMemo(() => getRank(stats.hitRate, stats.total), [stats.hitRate, stats.total]);

  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => eventTime(a) - eventTime(b));
    const recent = sorted.slice(-14);
    let cumulativeWon = 0, cumulativeLost = 0, cumulativeRefund = 0;
    const rawSeries = recent.map((item, index) => {
      if (item.status === "won") cumulativeWon += 1;
      if (item.status === "lost") cumulativeLost += 1;
      if (item.status === "refund") cumulativeRefund += 1;
      const settled = cumulativeWon + cumulativeLost + cumulativeRefund;
      const value = settled > 0 ? Math.round((cumulativeWon / settled) * 100) : 0;
      return {
        slot: `${index + 1}`,
        day: shortDay(item.event_start_at || item.published_at || "", language),
        value, access: item.access_level, status: item.status,
      };
    });
    const series = rawSeries.map((point, index, arr) => {
      const from = Math.max(0, index - 2);
      const window = arr.slice(from, index + 1);
      const avg = Math.round(window.reduce((sum, entry) => sum + entry.value, 0) / window.length);
      return { ...point, avg };
    });
    if (series.length >= 3) {
      const last3 = series.slice(-3);
      const trend = (last3[2].value - last3[0].value) / 2;
      const forecastValue = Math.max(0, Math.min(100, Math.round(last3[2].value + trend)));
      series.push({ ...last3[2], slot: `${series.length + 1}`, day: language === "ru" ? "Прогноз" : "Forecast", value: forecastValue, avg: forecastValue, status: "pending" as Status, access: last3[2].access, isForecast: true });
    }
    if (series.length === 0) {
      return [
        { slot: "1", day: "--", value: 0, avg: 0, access: "free" as AccessLevel, status: "pending" as Status },
        { slot: "2", day: "--", value: 0, avg: 0, access: "free" as AccessLevel, status: "pending" as Status },
      ];
    }
    if (series.length === 1) return [series[0], { ...series[0], slot: "2" }];
    return series;
  }, [items, language]);

  const barData = useMemo(() => {
    return (["free", "premium", "vip"] as AccessLevel[]).map((tier) => {
      const t = computeTierStats(items, tier);
      return { tier, hitRate: t.hitRate, won: t.won, lost: t.lost, count: t.count };
    });
  }, [items]);

  const trendDelta = (chartData[chartData.length - 2]?.value ?? 0) - (chartData[0]?.value ?? 0);
  const isEmpty = items.length === 0;
  const isPositive = trendDelta >= 0;
  const progressToNext = rank.next ? Math.max(0, Math.min(100, Math.round(((stats.hitRate - rank.min) / (rank.next - rank.min)) * 100))) : 100;

  const renderTierDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const access = (payload?.access as AccessLevel) || "free";
    const status = (payload?.status as Status) || "pending";
    const isForecast = payload?.isForecast;
    const statusColor = isForecast ? "#a78bfa" : STATUS_COLOR[status];
    const accessColor = ACCESS_COLOR[access];
    return (
      <g>
        <circle cx={cx} cy={cy} r={isForecast ? 6 : 10} fill={c.dotInner} stroke={statusColor} strokeWidth={isForecast ? 1.5 : 2.5} strokeDasharray={isForecast ? "2 2" : undefined} />
        {!isForecast && <circle cx={cx} cy={cy} r={4} fill={statusColor} />}
        {!isForecast && <circle cx={cx} cy={cy} r={13} fill="none" stroke={accessColor} strokeWidth={1.2} opacity={0.5} />}
      </g>
    );
  };

  const tooltipStyle = {
    backgroundColor: c.tooltipBg,
    border: `1px solid ${c.tooltipBorder}`,
    borderRadius: "10px",
    color: c.tooltipText,
    padding: "8px 11px",
    fontSize: 12,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.3)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%",
        borderRadius: 24,
        position: "relative",
        padding: 2,
        background: "linear-gradient(135deg, rgba(34,211,238,0.35), rgba(167,139,250,0.25), rgba(251,191,36,0.2))",
        boxShadow: c.shadow,
      }}
    >
      <div style={{ borderRadius: 22, background: c.bg, padding: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", right: -90, top: -100, background: `radial-gradient(circle, ${isPositive ? "rgba(52, 211, 153, 0.18)" : "rgba(248, 113, 113, 0.18)"}, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", left: -60, bottom: -80, background: `radial-gradient(circle, ${theme === "light" ? "rgba(8, 145, 178, 0.1)" : "rgba(34, 211, 238, 0.13)"}, transparent 65%)`, pointerEvents: "none" }} />

        {/* HERO */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, position: "relative" }}>
          <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
            <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={theme === "light" ? "#0891b2" : "#22d3ee"} />
                  <stop offset="50%" stopColor={theme === "light" ? "#7c3aed" : "#a78bfa"} />
                  <stop offset="100%" stopColor={theme === "light" ? "#d97706" : "#fbbf24"} />
                </linearGradient>
              </defs>
              <circle cx="48" cy="48" r="40" fill="none" stroke={c.subBorder} strokeWidth="7" />
              <motion.circle
                cx="48" cy="48" r="40" fill="none"
                stroke="url(#ringGrad)" strokeWidth="7" strokeLinecap="round"
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(stats.hitRate / 100) * 251} 251` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 6px ${theme === "light" ? "rgba(8,145,178,0.4)" : "rgba(34, 211, 238, 0.6)"})` }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: c.text, lineHeight: 1, letterSpacing: -1.5 }}>{stats.hitRate}%</span>
              <span style={{ fontSize: 8, color: c.textMuted, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{language === "ru" ? "ТОЧНОСТЬ" : "HIT RATE"}</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 28, filter: `drop-shadow(0 0 8px ${rank.color}80)` }}>{rank.icon}</div>
              <div>
                <div style={{ fontSize: 9, color: c.textDim, fontWeight: 600, letterSpacing: 0.4 }}>{language === "ru" ? "РАНГ" : "RANK"}</div>
                <div style={{ fontSize: 17, fontWeight: 760, color: rank.color, lineHeight: 1.1 }}>{rank.name}</div>
              </div>
            </div>

            {stats.streak > 0 ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "linear-gradient(135deg, rgba(251, 146, 60, 0.18), rgba(248, 113, 113, 0.12))", border: "1px solid rgba(251, 146, 60, 0.4)" }}>
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: 13 }}>🔥</motion.span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>{stats.streak} {language === "ru" ? "подряд" : "streak"}</span>
              </div>
            ) : null}

            {rank.next ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: c.textDim, marginBottom: 3 }}>
                  <span>{language === "ru" ? "До след. ранга" : "To next rank"}</span>
                  <span>{Math.abs(rank.next - stats.hitRate)}%</span>
                </div>
                <div style={{ height: 4, background: c.subBorder, borderRadius: 2, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 1, delay: 0.7, ease: "easeOut" }} style={{ height: "100%", background: `linear-gradient(90deg, ${rank.color}, ${c.text})`, borderRadius: 2 }} />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Мини-KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7, marginBottom: 14 }}>
          {[
            { label: language === "ru" ? "Тренд" : "Trend", value: `${isPositive ? "+" : ""}${trendDelta}%`, color: isPositive ? "#34d399" : "#f87171", icon: isPositive ? "↗" : "↘" },
            { label: "ROI", value: `${stats.roi > 0 ? "+" : ""}${stats.roi}%`, color: stats.roi >= 0 ? "#34d399" : "#f87171", icon: stats.roi >= 0 ? "↗" : "↘" },
            { label: language === "ru" ? "Сыграно" : "Settled", value: stats.settled, color: theme === "light" ? "#0891b2" : "#9dd7ff", icon: "●" },
            { label: language === "ru" ? "Всего" : "Total", value: stats.total, color: c.text, icon: "●" },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.06 }} whileHover={{ scale: 1.06, y: -2 }} style={{ border: `1px solid ${c.subBorder}`, borderRadius: 11, padding: "8px 9px", background: c.subBg }}>
              <div style={{ color: c.textDim, fontSize: 9, fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ color: kpi.color, fontWeight: 700, fontSize: 16, marginTop: 2 }}>{kpi.icon} {kpi.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Переключатель */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, padding: 3, background: c.subBg, borderRadius: 11, border: `1px solid ${c.subBorder}` }}>
          {(["trend", "bars"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: viewMode === mode ? "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(167,139,250,0.12))" : "transparent", color: viewMode === mode ? c.accentText : c.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.25s", boxShadow: viewMode === mode ? `0 0 12px ${theme === "light" ? "rgba(8,145,178,0.15)" : "rgba(34, 211, 238, 0.2)"}` : "none" }}>
              {mode === "trend" ? (language === "ru" ? "📈 Динамика" : "📈 Trend") : (language === "ru" ? "📊 Тарифы" : "📊 Tiers")}
            </button>
          ))}
        </div>

        {/* График */}
        <div style={{ height: 195, margin: "0 -4px", position: "relative" }}>
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: c.textMuted, fontSize: 13, textAlign: "center", gap: 8 }}>
                <motion.div animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} style={{ fontSize: 40 }}>📈</motion.div>
                <div>{language === "ru" ? "Пока нет данных для графика" : "No data yet"}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{language === "ru" ? "Добавьте прогнозы, чтобы увидеть динамику" : "Add predictions to see the trend"}</div>
              </motion.div>
            ) : viewMode === "trend" ? (
              <motion.div key="trend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 4 }}>
                    <defs>
                      <linearGradient id="signalAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.accent} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={c.accent} stopOpacity={0.02} />
                      </linearGradient>
                      <filter id="signalGlow" x="-20%" y="-30%" width="140%" height="160%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={c.accent} floodOpacity={theme === "light" ? "0.3" : "0.55"} />
                      </filter>
                    </defs>
                    {chartData.some((d: any) => d.isForecast) && <ReferenceArea x1={`${chartData.length - 1}`} x2={`${chartData.length}`} fill={c.forecastArea} />}
                    <CartesianGrid strokeDasharray="3 8" stroke={c.grid} vertical={false} />
                    <YAxis hide domain={[0, 100]} />
                    <ReferenceLine y={50} stroke={c.refLine} strokeDasharray="2 6" />
                    <XAxis dataKey="slot" axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={(slot) => chartData.find((item) => item.slot === String(slot))?.day || "--"} tick={{ fill: c.axisText, fontSize: 10 }} dy={6} />
                    <Tooltip formatter={(value, _name, entry) => { const row = entry?.payload as any; const tier = accessLabel((row?.access as AccessLevel) || "free", language); const status = row?.isForecast ? (language === "ru" ? "Прогноз" : "Forecast") : statusLabel((row?.status as Status) || "pending", language); return [`${value}% · ${tier} · ${status}`, language === "ru" ? "Точность" : "Hit rate"]; }} labelFormatter={(slot) => chartData.find((item) => item.slot === String(slot))?.day || "--"} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="avg" stroke={theme === "light" ? "rgba(100, 116, 139, 0.5)" : "rgba(148, 187, 230, 0.45)"} strokeWidth={1.6} dot={false} strokeDasharray="4 5" isAnimationActive />
                    <Area type="monotone" dataKey="value" stroke={c.accent} strokeWidth={3.4} fill="url(#signalAreaFill)" filter="url(#signalGlow)" dot={renderTierDot} activeDot={{ r: 8, fill: c.accent, stroke: c.dotInner, strokeWidth: 3 }} isAnimationActive animationDuration={900} />
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={barData} margin={{ top: 14, right: 10, left: -10, bottom: 4 }}>
                    <defs>
                      {(["free", "premium", "vip"] as AccessLevel[]).map((tier) => {
                        const [c1, c2] = ACCESS_GRADIENT[tier];
                        return <linearGradient key={tier} id={`barFill_${tier}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c1} stopOpacity={0.98} /><stop offset="100%" stopColor={c2} stopOpacity={0.65} /></linearGradient>;
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 8" stroke={c.grid} vertical={false} />
                    <YAxis hide domain={[0, 100]} />
                    <ReferenceLine y={50} stroke={c.refLine} strokeDasharray="2 6" />
                    <XAxis dataKey="tier" axisLine={false} tickLine={false} tickFormatter={(v) => accessLabel(v as AccessLevel, language)} tick={{ fill: c.textMuted, fontSize: 11, fontWeight: 600 }} dy={6} />
                    <Tooltip cursor={{ fill: theme === "light" ? "rgba(8, 145, 178, 0.05)" : "rgba(34, 211, 238, 0.06)" }} formatter={(value, _name, entry) => { const row = entry?.payload as any; return [`${value}% · ${row?.won || 0}W/${row?.lost || 0}L`, language === "ru" ? "Точность" : "Hit rate"]; }} contentStyle={tooltipStyle} />
                    <Bar dataKey="hitRate" radius={[8, 8, 4, 4]} barSize={58} isAnimationActive animationDuration={800}>
                      {barData.map((entry) => <Cell key={entry.tier} fill={`url(#barFill_${entry.tier})`} opacity={hoveredTier && hoveredTier !== entry.tier ? 0.35 : 1} />)}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Легенда */}
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10 }}>
          {(Object.keys(STATUS_COLOR) as Status[]).map((status) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 4, color: c.textMuted }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status], display: "inline-block", boxShadow: `0 0 6px ${STATUS_COLOR[status]}99` }} />
              {statusLabel(status, language)}
              <span style={{ color: c.textDim, fontWeight: 600 }}>{status === "won" ? stats.won : status === "lost" ? stats.lost : status === "refund" ? stats.refund : stats.pending}</span>
            </div>
          ))}
        </div>

        {/* Карточки */}
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {(["free", "premium", "vip"] as AccessLevel[]).map((tier, idx) => {
            const tierStats = stats[tier];
            const [c1, c2] = ACCESS_GRADIENT[tier];
            return (
              <motion.div key={tier} onMouseEnter={() => setHoveredTier(tier)} onMouseLeave={() => setHoveredTier(null)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.08 }} whileHover={{ scale: 1.05, y: -3 }} style={{ borderRadius: 13, padding: "11px 12px", cursor: "pointer", background: `linear-gradient(160deg, ${c1}${theme === "light" ? "14" : "1a"}, ${c2}08 70%)`, border: `1px solid ${c1}40`, boxShadow: hoveredTier === tier ? `0 10px 24px ${c1}35` : "none", transition: "box-shadow 0.25s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: c1, display: "inline-block", boxShadow: `0 0 7px ${c1}` }} />
                  <small style={{ color: c1, fontWeight: 700, fontSize: 10, letterSpacing: 0.3 }}>{accessLabel(tier, language)}</small>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 1, marginTop: 5 }}>
                  <strong style={{ color: c.tierLabel, fontSize: 22, lineHeight: 1, fontWeight: 800 }}>{tierStats.hitRate}</strong>
                  <span style={{ color: c.textMuted, fontSize: 12, fontWeight: 600 }}>%</span>
                </div>
                <div style={{ color: c.textDim, fontSize: 10, marginTop: 2 }}>
                  <span style={{ color: "#34d399" }}>{tierStats.won}W</span>{" / "}<span style={{ color: "#f87171" }}>{tierStats.lost}L</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
