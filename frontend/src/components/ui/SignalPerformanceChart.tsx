import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Cell, Bar } from "recharts";
import { motion } from "framer-motion";

import type { Prediction } from "../../services/api";

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

function eventTime(item: Prediction): number {
  const ts = new Date(item.published_at || item.event_start_at).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function shortDay(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

function accessLabel(level: AccessLevel, language: "ru" | "en"): string {
  if (level === "premium") return "Premium";
  if (level === "vip") return "VIP";
  return language === "ru" ? "Free" : "Free";
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

type ViewMode = "trend" | "bars";

export function SignalPerformanceChart({ items, language }: SignalPerformanceChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("trend");
  const [hoveredTier, setHoveredTier] = useState<AccessLevel | null>(null);

  const stats = useMemo(() => {
    const won = items.filter((item) => item.status === "won").length;
    const lost = items.filter((item) => item.status === "lost").length;
    const refund = items.filter((item) => item.status === "refund").length;
    const pending = items.filter((item) => item.status === "pending").length;
    const settled = won + lost + refund;
    const hitRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
    const roi = settled > 0 ? Math.round((won * 0.85 - lost) / settled * 100) : 0;

    return {
      won,
      lost,
      refund,
      pending,
      total: items.length,
      settled,
      hitRate,
      roi,
      free: computeTierStats(items, "free"),
      premium: computeTierStats(items, "premium"),
      vip: computeTierStats(items, "vip"),
    };
  }, [items]);

  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => eventTime(a) - eventTime(b));
    const recent = sorted.slice(-14);

    let cumulativeWon = 0;
    let cumulativeLost = 0;
    let cumulativeRefund = 0;

    const rawSeries = recent.map((item, index) => {
      if (item.status === "won") cumulativeWon += 1;
      if (item.status === "lost") cumulativeLost += 1;
      if (item.status === "refund") cumulativeRefund += 1;

      const settled = cumulativeWon + cumulativeLost + cumulativeRefund;
      const value = settled > 0 ? Math.round((cumulativeWon / settled) * 100) : 0;

      return {
        slot: `${index + 1}`,
        day: shortDay(item.event_start_at || item.published_at || "", language),
        value,
        access: item.access_level,
        status: item.status,
      };
    });

    const series = rawSeries.map((point, index, arr) => {
      const from = Math.max(0, index - 2);
      const window = arr.slice(from, index + 1);
      const avg = Math.round(window.reduce((sum, entry) => sum + entry.value, 0) / window.length);
      return { ...point, avg };
    });

    if (series.length === 0) {
      return [
        { slot: "1", day: "--", value: 0, avg: 0, access: "free" as AccessLevel, status: "pending" as Status },
        { slot: "2", day: "--", value: 0, avg: 0, access: "free" as AccessLevel, status: "pending" as Status },
      ];
    }

    if (series.length === 1) {
      return [series[0], { ...series[0], slot: "2" }];
    }

    return series;
  }, [items, language]);

  const barData = useMemo(() => {
    const tiers: AccessLevel[] = ["free", "premium", "vip"];
    return tiers.map((tier) => {
      const t = computeTierStats(items, tier);
      return { tier, hitRate: t.hitRate, won: t.won, lost: t.lost, count: t.count };
    });
  }, [items]);

  const startValue = chartData[0]?.value ?? 0;
  const endValue = chartData[chartData.length - 1]?.value ?? 0;
  const trendAvg = chartData[chartData.length - 1]?.avg ?? 0;
  const trendDelta = endValue - startValue;
  const isEmpty = items.length === 0;
  const isPositive = trendDelta >= 0;

  const renderTierDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const access = (payload?.access as AccessLevel) || "free";
    const status = (payload?.status as Status) || "pending";
    const statusColor = STATUS_COLOR[status];
    const accessColor = ACCESS_COLOR[access];
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill="#0a1428" stroke={statusColor} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={4} fill={statusColor} />
        <circle cx={cx} cy={cy} r={13} fill="none" stroke={accessColor} strokeWidth={1.2} opacity={0.5} />
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%",
        borderRadius: 22,
        border: "1px solid rgba(56, 99, 147, 0.4)",
        background:
          "linear-gradient(165deg, #0b1424 0%, #08111f 60%, #0a1626 100%)",
        boxShadow: "0 16px 40px rgba(3, 8, 18, 0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
        overflow: "hidden",
        position: "relative",
        padding: 18,
      }}
    >
      {/* Декоративные свечения */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          right: -70,
          top: -80,
          background: `radial-gradient(circle, ${isPositive ? "rgba(52, 211, 153, 0.22)" : "rgba(248, 113, 113, 0.22)"}, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Заголовок + главный KPI */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              borderRadius: 999,
              padding: "5px 12px",
              border: "1px solid rgba(98, 145, 205, 0.4)",
              background: "rgba(11, 29, 52, 0.6)",
              color: "#67e8f9",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 8px #34d399" }}
            />
            {language === "ru" ? "LIVE ДИНАМИКА" : "LIVE PERFORMANCE"}
          </div>
          <h3 style={{ color: "#f8fbff", fontSize: 22, fontWeight: 740, marginTop: 10, lineHeight: 1.1 }}>
            {language === "ru" ? "Рабочая лента сигналов" : "Signal performance"}
          </h3>
        </div>

        <motion.div
          key={stats.hitRate}
          initial={{ scale: 0.85, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          style={{ textAlign: "right", flexShrink: 0 }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
            <span
              style={{
                color: "#ffffff",
                fontSize: 44,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: -1.8,
                backgroundImage: "linear-gradient(135deg, #ffffff 30%, #67e8f9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {stats.hitRate}
            </span>
            <span style={{ color: "#8ca4c2", fontSize: 18, fontWeight: 600 }}>%</span>
          </div>
          <div style={{ color: "#22d3ee", marginTop: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>
            {language === "ru" ? "ТОЧНОСТЬ" : "HIT RATE"}
          </div>
        </motion.div>
      </div>

      {/* Мини-KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7, marginBottom: 14 }}>
        <motion.div whileHover={{ scale: 1.04, y: -2 }} style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 11, padding: "7px 9px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 9 }}>{language === "ru" ? "Тренд" : "Trend"}</div>
          <div style={{ color: isPositive ? "#34d399" : "#f87171", fontWeight: 700, fontSize: 16 }}>
            {isPositive ? "▲" : "▼"} {Math.abs(trendDelta)}%
          </div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04, y: -2 }} style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 11, padding: "7px 9px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 9 }}>{language === "ru" ? "Стабил." : "Stab."}</div>
          <div style={{ color: "#9dd7ff", fontWeight: 700, fontSize: 16 }}>{trendAvg}%</div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04, y: -2 }} style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 11, padding: "7px 9px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 9 }}>ROI</div>
          <div style={{ color: stats.roi >= 0 ? "#34d399" : "#f87171", fontWeight: 700, fontSize: 16 }}>
            {stats.roi > 0 ? "+" : ""}{stats.roi}%
          </div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04, y: -2 }} style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 11, padding: "7px 9px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 9 }}>{language === "ru" ? "Всего" : "Total"}</div>
          <div style={{ color: "#e9f3ff", fontWeight: 700, fontSize: 16 }}>{stats.total}</div>
        </motion.div>
      </div>

      {/* Переключатель режимов */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["trend", "bars"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 9,
              border: `1px solid ${viewMode === mode ? "rgba(34, 211, 238, 0.5)" : "rgba(90, 137, 190, 0.25)"}`,
              background: viewMode === mode ? "rgba(34, 211, 238, 0.12)" : "rgba(10, 23, 41, 0.4)",
              color: viewMode === mode ? "#67e8f9" : "#7d97b7",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {mode === "trend" ? (language === "ru" ? "📈 Динамика" : "📈 Trend") : (language === "ru" ? "📊 По тарифам" : "📊 By tier")}
          </button>
        ))}
      </div>

      {/* График */}
      <div style={{ height: 200, margin: "0 -4px", position: "relative" }}>
        {isEmpty ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#6e86a4",
              fontSize: 13,
              textAlign: "center",
              gap: 8,
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: 36 }}
            >
              📈
            </motion.div>
            <div>{language === "ru" ? "Пока нет данных для графика" : "No data yet"}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {language === "ru" ? "Добавьте прогнозы, чтобы увидеть динамику" : "Add predictions to see the trend"}
            </div>
          </div>
        ) : viewMode === "trend" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 4 }}>
              <defs>
                <linearGradient id="signalAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <filter id="signalGlow" x="-20%" y="-30%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.5" />
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="3 8" stroke="rgba(92, 128, 170, 0.15)" vertical={false} />
              <YAxis hide domain={[0, 100]} />
              <ReferenceLine y={50} stroke="rgba(148, 187, 230, 0.16)" strokeDasharray="2 6" />
              <XAxis
                dataKey="slot"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickFormatter={(slot) => {
                  const point = chartData.find((item) => item.slot === String(slot));
                  return point?.day || "--";
                }}
                tick={{ fill: "#60789a", fontSize: 10 }}
                dy={6}
              />

              <Tooltip
                formatter={(value, _name, entry) => {
                  const row = entry?.payload;
                  const tier = accessLabel((row?.access as AccessLevel) || "free", language);
                  const status = statusLabel((row?.status as Status) || "pending", language);
                  return [`${value}% · ${tier} · ${status}`, language === "ru" ? "Точность" : "Hit rate"];
                }}
                labelFormatter={(slot) => {
                  const point = chartData.find((item) => item.slot === String(slot));
                  return point?.day || "--";
                }}
                contentStyle={{
                  backgroundColor: "rgba(15, 28, 48, 0.97)",
                  border: "1px solid rgba(105, 151, 207, 0.4)",
                  borderRadius: "10px",
                  color: "#e4edf8",
                  padding: "8px 11px",
                  fontSize: 12,
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
                }}
              />

              <Line
                type="monotone"
                dataKey="avg"
                stroke="rgba(148, 187, 230, 0.5)"
                strokeWidth={1.6}
                dot={false}
                strokeDasharray="4 5"
                isAnimationActive
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={3.2}
                fill="url(#signalAreaFill)"
                filter="url(#signalGlow)"
                dot={renderTierDot}
                activeDot={{ r: 8, fill: "#22d3ee", stroke: "#081425", strokeWidth: 3 }}
                isAnimationActive
                animationDuration={900}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={barData} margin={{ top: 14, right: 10, left: -10, bottom: 4 }}>
              <defs>
                {(["free", "premium", "vip"] as AccessLevel[]).map((tier) => {
                  const [c1, c2] = ACCESS_GRADIENT[tier];
                  return (
                    <linearGradient key={tier} id={`barFill_${tier}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c1} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={c2} stopOpacity={0.6} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 8" stroke="rgba(92, 128, 170, 0.15)" vertical={false} />
              <YAxis hide domain={[0, 100]} />
              <ReferenceLine y={50} stroke="rgba(148, 187, 230, 0.16)" strokeDasharray="2 6" />
              <XAxis
                dataKey="tier"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => accessLabel(v as AccessLevel, language)}
                tick={{ fill: "#7d97b7", fontSize: 11, fontWeight: 600 }}
                dy={6}
              />
              <Tooltip
                cursor={{ fill: "rgba(34, 211, 238, 0.06)" }}
                formatter={(value, _name, entry) => {
                  const row = entry?.payload;
                  return [`${value}% · ${row?.won || 0}W/${row?.lost || 0}L`, language === "ru" ? "Точность" : "Hit rate"];
                }}
                contentStyle={{
                  backgroundColor: "rgba(15, 28, 48, 0.97)",
                  border: "1px solid rgba(105, 151, 207, 0.4)",
                  borderRadius: "10px",
                  color: "#e4edf8",
                  padding: "8px 11px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="hitRate" radius={[8, 8, 4, 4]} barSize={56} isAnimationActive animationDuration={800}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.tier}
                    fill={`url(#barFill_${entry.tier})`}
                    opacity={hoveredTier && hoveredTier !== entry.tier ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Легенда статусов */}
      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10 }}>
        {(Object.keys(STATUS_COLOR) as Status[]).map((status) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 4, color: "#8ca4c2" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status], display: "inline-block", boxShadow: `0 0 6px ${STATUS_COLOR[status]}99` }} />
            {statusLabel(status, language)}
            <span style={{ color: "#6e86a4", fontWeight: 600 }}>
              {status === "won" ? stats.won : status === "lost" ? stats.lost : status === "refund" ? stats.refund : stats.pending}
            </span>
          </div>
        ))}
      </div>

      {/* Карточки по уровням — интерактивные */}
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {(["free", "premium", "vip"] as AccessLevel[]).map((tier, idx) => {
          const tierStats = stats[tier];
          const [c1, c2] = ACCESS_GRADIENT[tier];
          return (
            <motion.div
              key={tier}
              onMouseEnter={() => setHoveredTier(tier)}
              onMouseLeave={() => setHoveredTier(null)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              whileHover={{ scale: 1.04, y: -3 }}
              style={{
                borderRadius: 12,
                padding: "10px 11px",
                cursor: "pointer",
                background: `linear-gradient(160deg, ${c1}14, ${c2}08 70%)`,
                border: `1px solid ${c1}3a`,
                boxShadow: hoveredTier === tier ? `0 8px 20px ${c1}30` : "none",
                transition: "box-shadow 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c1, display: "inline-block", boxShadow: `0 0 6px ${c1}` }} />
                <small style={{ color: c1, fontWeight: 700, fontSize: 10, letterSpacing: 0.3 }}>{accessLabel(tier, language)}</small>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 1, marginTop: 4 }}>
                <strong style={{ color: "#ffffff", fontSize: 22, lineHeight: 1, fontWeight: 800 }}>{tierStats.hitRate}</strong>
                <span style={{ color: "#8ca4c2", fontSize: 12, fontWeight: 600 }}>%</span>
              </div>
              <div style={{ color: "#6e86a4", fontSize: 10, marginTop: 2 }}>
                <span style={{ color: "#34d399" }}>{tierStats.won}W</span>
                {" / "}
                <span style={{ color: "#f87171" }}>{tierStats.lost}L</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
