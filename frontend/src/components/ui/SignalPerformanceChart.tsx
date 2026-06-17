import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";

import type { Prediction } from "../../services/api";

type SignalPerformanceChartProps = {
  items: Prediction[];
  language: "ru" | "en";
};

type AccessLevel = Prediction["access_level"];

const ACCESS_COLOR: Record<AccessLevel, string> = {
  free: "#67e8f9",
  premium: "#fbbf24",
  vip: "#a78bfa",
};

const STATUS_COLOR: Record<Prediction["status"], string> = {
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
  return language === "ru" ? "Бесплатно" : "Free";
}

function statusLabel(status: Prediction["status"], language: "ru" | "en"): string {
  if (language === "ru") {
    if (status === "won") return "Победа";
    if (status === "lost") return "Поражение";
    if (status === "refund") return "Возврат";
    return "В ожидании";
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
  return { count: subset.length, hitRate, won, lost };
}

export function SignalPerformanceChart({ items, language }: SignalPerformanceChartProps) {
  const stats = useMemo(() => {
    const won = items.filter((item) => item.status === "won").length;
    const lost = items.filter((item) => item.status === "lost").length;
    const refund = items.filter((item) => item.status === "refund").length;
    const pending = items.filter((item) => item.status === "pending").length;
    const settled = won + lost + refund;
    const hitRate = settled > 0 ? Math.round((won / settled) * 100) : 0;

    return {
      won,
      lost,
      refund,
      pending,
      total: items.length,
      settled,
      hitRate,
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
        { slot: "1", day: "--", value: 0, avg: 0, access: "free" as AccessLevel, status: "pending" as Prediction["status"] },
        { slot: "2", day: "--", value: 0, avg: 0, access: "free" as AccessLevel, status: "pending" as Prediction["status"] },
      ];
    }

    if (series.length === 1) {
      return [series[0], { ...series[0], slot: "2" }];
    }

    return series;
  }, [items, language]);

  const startValue = chartData[0]?.value ?? 0;
  const endValue = chartData[chartData.length - 1]?.value ?? 0;
  const trendAvg = chartData[chartData.length - 1]?.avg ?? 0;
  const trendDelta = endValue - startValue;

  const renderTierDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const access = (payload?.access as AccessLevel) || "free";
    const status = (payload?.status as Prediction["status"]) || "pending";
    const accessColor = ACCESS_COLOR[access];
    const statusColor = STATUS_COLOR[status];
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#0a1428" stroke={statusColor} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={3} fill={statusColor} />
        <circle cx={cx} cy={cy} r={11} fill="none" stroke={accessColor} strokeWidth={1.2} opacity={0.45} />
      </g>
    );
  };

  const isEmpty = items.length === 0;

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 20,
        border: "1px solid rgba(56, 99, 147, 0.45)",
        background:
          "linear-gradient(165deg, #0b1424 0%, #08111f 60%, #0a1626 100%)",
        boxShadow: "0 14px 34px rgba(3, 8, 18, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
        padding: 18,
      }}
    >
      {/* Заголовок + главный KPI */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              padding: "4px 11px",
              border: "1px solid rgba(98, 145, 205, 0.4)",
              background: "rgba(11, 29, 52, 0.6)",
              color: "#67e8f9",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
            {language === "ru" ? "ДИНАМИКА ТОЧНОСТИ" : "ACCURACY TREND"}
          </div>
          <h3 style={{ color: "#f8fbff", fontSize: 21, fontWeight: 720, marginTop: 10, lineHeight: 1.1 }}>
            {language === "ru" ? "Рабочая лента сигналов" : "Signal performance"}
          </h3>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ color: "#ffffff", fontSize: 42, lineHeight: 1, fontWeight: 800, letterSpacing: -1.5 }}>
              {stats.hitRate}
            </span>
            <span style={{ color: "#8ca4c2", fontSize: 18, fontWeight: 600 }}>%</span>
          </div>
          <div style={{ color: "#22d3ee", marginTop: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>
            {language === "ru" ? "ТОЧНОСТЬ" : "HIT RATE"}
          </div>
        </div>
      </div>

      {/* Сетка мини-KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 14 }}>
        <div style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 12, padding: "8px 10px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 10 }}>{language === "ru" ? "Тренд" : "Trend"}</div>
          <div style={{ color: trendDelta >= 0 ? "#34d399" : "#f87171", fontWeight: 700, fontSize: 17 }}>
            {trendDelta > 0 ? "▲" : trendDelta < 0 ? "▼" : "—"} {Math.abs(trendDelta)}%
          </div>
        </div>
        <div style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 12, padding: "8px 10px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 10 }}>{language === "ru" ? "Стабильность" : "Stability"}</div>
          <div style={{ color: "#9dd7ff", fontWeight: 700, fontSize: 17 }}>{trendAvg}%</div>
        </div>
        <div style={{ border: "1px solid rgba(90, 137, 190, 0.3)", borderRadius: 12, padding: "8px 10px", background: "rgba(10, 23, 41, 0.5)" }}>
          <div style={{ color: "#7d97b7", fontSize: 10 }}>{language === "ru" ? "Всего" : "Total"}</div>
          <div style={{ color: "#e9f3ff", fontWeight: 700, fontSize: 17 }}>{stats.total}</div>
        </div>
      </div>

      {/* График */}
      <div style={{ height: 220, margin: "0 -4px", position: "relative" }}>
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
            <div style={{ fontSize: 32, opacity: 0.6 }}>📈</div>
            <div>{language === "ru" ? "Пока нет данных для графика" : "No data yet"}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {language === "ru" ? "Добавьте прогнозы, чтобы увидеть динамику" : "Add predictions to see the trend"}
            </div>
          </div>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 4 }}>
            <defs>
              <linearGradient id="signalAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
              <filter id="signalGlow" x="-20%" y="-30%" width="140%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#22d3ee" floodOpacity="0.4" />
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 8" stroke="rgba(92, 128, 170, 0.18)" vertical={false} />
            <YAxis hide domain={[0, 100]} />
            <ReferenceLine y={50} stroke="rgba(148, 187, 230, 0.18)" strokeDasharray="2 6" />
            <XAxis
              dataKey="slot"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={(slot) => {
                const point = chartData.find((item) => item.slot === String(slot));
                return point?.day || "--";
              }}
              tick={{ fill: "#60789a", fontSize: 11 }}
              dy={8}
            />

            <Tooltip
              formatter={(value, _name, entry) => {
                const row = entry?.payload;
                const tier = accessLabel((row?.access as AccessLevel) || "free", language);
                const status = statusLabel((row?.status as Prediction["status"]) || "pending", language);
                return [`${value}% · ${tier} · ${status}`, language === "ru" ? "Точность" : "Hit rate"];
              }}
              labelFormatter={(slot) => {
                const point = chartData.find((item) => item.slot === String(slot));
                return point?.day || "--";
              }}
              contentStyle={{
                backgroundColor: "rgba(15, 28, 48, 0.96)",
                border: "1px solid rgba(105, 151, 207, 0.35)",
                borderRadius: "10px",
                color: "#e4edf8",
                padding: "8px 11px",
                fontSize: 12,
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.55)",
              }}
            />

            <Line
              type="monotone"
              dataKey="avg"
              stroke="rgba(148, 187, 230, 0.55)"
              strokeWidth={1.8}
              dot={false}
              strokeDasharray="4 5"
              isAnimationActive
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={3.5}
              fill="url(#signalAreaFill)"
              filter="url(#signalGlow)"
              dot={renderTierDot}
              activeDot={{ r: 8, fill: "#22d3ee", stroke: "#081425", strokeWidth: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Легенда статусов */}
      <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
        {(Object.keys(STATUS_COLOR) as Prediction["status"][]).map((status) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 5, color: "#8ca4c2" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status], display: "inline-block" }} />
            {statusLabel(status, language)}
          </div>
        ))}
      </div>

      {/* Карточки по уровням доступа */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {(["free", "premium", "vip"] as AccessLevel[]).map((tier) => {
          const tierStats = stats[tier];
          const color = ACCESS_COLOR[tier];
          return (
            <article
              key={tier}
              style={{
                border: `1px solid ${color}33`,
                borderRadius: 12,
                background: `linear-gradient(160deg, ${color}0d, transparent)`,
                padding: "10px 11px",
                display: "grid",
                gap: 3,
              }}
            >
              <small style={{ color, fontWeight: 700, fontSize: 11 }}>{accessLabel(tier, language)}</small>
              <strong style={{ color: "#e9f3ff", fontSize: 20, lineHeight: 1 }}>{tierStats.hitRate}%</strong>
              <span style={{ color: "#6e86a4", fontSize: 10 }}>
                {tierStats.won}W / {tierStats.lost}L
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
