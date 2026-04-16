import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

const ACCESS_BORDER: Record<AccessLevel, string> = {
  free: "rgba(103, 232, 249, 0.42)",
  premium: "rgba(251, 191, 36, 0.42)",
  vip: "rgba(167, 139, 250, 0.44)",
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
  return { count: subset.length, hitRate };
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
      hitRate,
      free: computeTierStats(items, "free"),
      premium: computeTierStats(items, "premium"),
      vip: computeTierStats(items, "vip"),
    };
  }, [items]);

  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => eventTime(a) - eventTime(b));
    const recent = sorted.slice(-16);

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
  const qualityIndex = Math.round(stats.hitRate * 0.7 + trendAvg * 0.3);

  const renderTierDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = ACCESS_COLOR[(payload?.access as AccessLevel) || "free"];
    return (
      <g>
        <circle cx={cx} cy={cy} r={7.2} fill="rgba(8,18,34,0.85)" stroke={color} strokeWidth={2.8} />
        <circle cx={cx} cy={cy} r={2.4} fill={color} />
      </g>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 24,
        border: "1px solid rgba(56, 99, 147, 0.65)",
        background:
          "radial-gradient(circle at 84% -18%, rgba(49, 209, 255, 0.18), transparent 40%), radial-gradient(circle at 6% 122%, rgba(80, 236, 203, 0.12), transparent 44%), linear-gradient(165deg, #091221 0%, #070f1d 55%, #081425 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 38px rgba(3, 8, 18, 0.5)",
        overflow: "hidden",
        position: "relative",
        padding: 18,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          right: -56,
          top: -70,
          background: "radial-gradient(circle, rgba(49,209,255,0.22), rgba(49,209,255,0))",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: "50%",
          left: -48,
          bottom: -90,
          background: "radial-gradient(circle, rgba(89,237,203,0.2), rgba(89,237,203,0))",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "5px 12px",
              border: "1px solid rgba(98, 145, 205, 0.45)",
              background: "rgba(11, 29, 52, 0.62)",
              color: "#67e8f9",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.45,
            }}
          >
            {language === "ru" ? "ДИНАМИКА ТОЧНОСТИ" : "ACCURACY TREND"}
          </div>
          <h3 style={{ color: "#f8fbff", fontSize: 24, fontWeight: 760, marginTop: 10, lineHeight: 1.08 }}>
            {language === "ru" ? "Рабочая лента сигналов" : "Signal performance"}
          </h3>
          <p style={{ color: "#8ca4c2", fontSize: 13, marginTop: 6 }}>
            {language === "ru" ? "Реальная статистика + разрез по Premium и VIP" : "Real stats with Premium and VIP split"}
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "#ffffff", fontSize: 48, lineHeight: 1, fontWeight: 800, letterSpacing: -1.6 }}>{stats.hitRate}%</div>
          <div style={{ color: "#22d3ee", marginTop: 2, fontSize: 11, fontWeight: 700 }}>
            {language === "ru" ? "СРЕДНЯЯ ТОЧНОСТЬ" : "AVERAGE ACCURACY"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 10 }}>
        <div style={{ border: "1px solid rgba(90, 137, 190, 0.35)", borderRadius: 12, padding: "7px 9px", background: "rgba(10, 23, 41, 0.54)" }}>
          <div style={{ color: "#7d97b7", fontSize: 10 }}>{language === "ru" ? "Дельта" : "Delta"}</div>
          <div style={{ color: trendDelta >= 0 ? "#66f2ca" : "#ff96a5", fontWeight: 700, fontSize: 18 }}>
            {trendDelta > 0 ? `+${trendDelta}` : trendDelta}%
          </div>
        </div>
        <div style={{ border: "1px solid rgba(90, 137, 190, 0.35)", borderRadius: 12, padding: "7px 9px", background: "rgba(10, 23, 41, 0.54)" }}>
          <div style={{ color: "#7d97b7", fontSize: 10 }}>{language === "ru" ? "Стабильность" : "Stability"}</div>
          <div style={{ color: "#9dd7ff", fontWeight: 700, fontSize: 18 }}>{trendAvg}%</div>
        </div>
        <div style={{ border: "1px solid rgba(90, 137, 190, 0.35)", borderRadius: 12, padding: "7px 9px", background: "rgba(10, 23, 41, 0.54)" }}>
          <div style={{ color: "#7d97b7", fontSize: 10 }}>{language === "ru" ? "Индекс" : "Index"}</div>
          <div style={{ color: "#cde8ff", fontWeight: 700, fontSize: 18 }}>{qualityIndex}%</div>
        </div>
      </div>

      <div style={{ height: 248, margin: "0 -4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 18, left: -8, bottom: 4 }}>
            <defs>
              <linearGradient id="signalAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.86} />
                <stop offset="68%" stopColor="#22d3ee" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
              <filter id="signalGlow" x="-20%" y="-30%" width="140%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.4" floodColor="#22d3ee" floodOpacity="0.46" />
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 8" stroke="rgba(92, 128, 170, 0.24)" vertical={false} />
            <YAxis hide domain={[0, 100]} />
            <XAxis
              dataKey="slot"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={(slot) => {
                const point = chartData.find((item) => item.slot === String(slot));
                return point?.day || "--";
              }}
              tick={{ fill: "#60789a", fontSize: 12 }}
              dy={10}
            />

            <Tooltip
              formatter={(value, _name, entry) => {
                const row = entry?.payload;
                const tier = accessLabel((row?.access as AccessLevel) || "free", language);
                return [`${value}% · ${tier}`, language === "ru" ? "Точность" : "Accuracy"];
              }}
              labelFormatter={(slot) => {
                const point = chartData.find((item) => item.slot === String(slot));
                const status = point ? statusLabel(point.status, language) : "--";
                return `${language === "ru" ? "Дата" : "Date"}: ${point?.day || "--"} · ${status}`;
              }}
              contentStyle={{
                backgroundColor: "#152238",
                border: "1px solid rgba(105, 151, 207, 0.4)",
                borderRadius: "11px",
                color: "#e4edf8",
                padding: "9px 12px",
                boxShadow: "0 14px 30px rgba(0, 0, 0, 0.5)",
              }}
            />

            <Line
              type="monotone"
              dataKey="avg"
              stroke="rgba(148, 187, 230, 0.72)"
              strokeWidth={2.1}
              dot={false}
              strokeDasharray="5 5"
              isAnimationActive
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={4.8}
              fill="url(#signalAreaFill)"
              filter="url(#signalGlow)"
              dot={renderTierDot}
              activeDot={{ r: 7.8, fill: "#22d3ee", stroke: "#081425", strokeWidth: 3.6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {(["free", "premium", "vip"] as AccessLevel[]).map((tier) => {
          const tierStats = stats[tier];
          const color = ACCESS_COLOR[tier];
          const border = ACCESS_BORDER[tier];
          return (
            <article
              key={tier}
              style={{
                border: `1px solid ${border}`,
                borderRadius: 12,
                background: "rgba(10, 23, 41, 0.58)",
                padding: "8px 9px",
                display: "grid",
                gap: 2,
              }}
            >
              <small style={{ color, fontWeight: 700, fontSize: 11 }}>{accessLabel(tier, language)}</small>
              <strong style={{ color: "#e9f3ff", fontSize: 18, lineHeight: 1.1 }}>{tierStats.hitRate}%</strong>
              <span style={{ color: "#6e86a4", fontSize: 11 }}>
                {language === "ru" ? "Сигналы" : "Signals"}: {tierStats.count}
              </span>
            </article>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginTop: 10, textAlign: "center" }}>
        <div>
          <div style={{ color: "#34d399", fontSize: 26, fontWeight: 700 }}>{stats.won}</div>
          <div style={{ color: "#6e86a4", fontSize: 11 }}>{language === "ru" ? "Победы" : "Wins"}</div>
        </div>
        <div>
          <div style={{ color: "#f87171", fontSize: 26, fontWeight: 700 }}>{stats.lost}</div>
          <div style={{ color: "#6e86a4", fontSize: 11 }}>{language === "ru" ? "Поражения" : "Lost"}</div>
        </div>
        <div>
          <div style={{ color: "#fbbf24", fontSize: 26, fontWeight: 700 }}>{stats.refund}</div>
          <div style={{ color: "#6e86a4", fontSize: 11 }}>{language === "ru" ? "Возвраты" : "Refund"}</div>
        </div>
        <div>
          <div style={{ color: "#38bdf8", fontSize: 26, fontWeight: 700 }}>{stats.pending}</div>
          <div style={{ color: "#6e86a4", fontSize: 11 }}>{language === "ru" ? "В ожидании" : "Pending"}</div>
        </div>
      </div>
    </div>
  );
}
