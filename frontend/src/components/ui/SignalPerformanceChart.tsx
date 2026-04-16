import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { Prediction } from "../../services/api";

type SignalPerformanceChartProps = {
  items: Prediction[];
  language: "ru" | "en";
};

function eventTime(item: Prediction): number {
  const ts = new Date(item.published_at || item.event_start_at).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function formatDay(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function SignalPerformanceChart({ items, language }: SignalPerformanceChartProps) {
  const stats = useMemo(() => {
    const won = items.filter((item) => item.status === "won").length;
    const lost = items.filter((item) => item.status === "lost").length;
    const refund = items.filter((item) => item.status === "refund").length;
    const pending = items.filter((item) => item.status === "pending").length;
    const settled = won + lost + refund;
    const hitRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
    return { won, lost, refund, pending, hitRate };
  }, [items]);

  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => eventTime(a) - eventTime(b));
    const grouped = new Map<string, { date: string; won: number; lost: number; refund: number }>();

    sorted.forEach((item) => {
      const dateKey = formatDay(item.event_start_at || item.published_at || "", language);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { date: dateKey, won: 0, lost: 0, refund: 0 });
      }

      const day = grouped.get(dateKey);
      if (!day) return;

      if (item.status === "won") day.won += 1;
      if (item.status === "lost") day.lost += 1;
      if (item.status === "refund") day.refund += 1;
    });

    let cumulativeWon = 0;
    let cumulativeLost = 0;
    let cumulativeRefund = 0;

    const series = Array.from(grouped.values())
      .slice(-7)
      .map((day) => {
        cumulativeWon += day.won;
        cumulativeLost += day.lost;
        cumulativeRefund += day.refund;
        const settled = cumulativeWon + cumulativeLost + cumulativeRefund;
        const value = settled > 0 ? Math.round((cumulativeWon / settled) * 100) : 0;
        return { date: day.date, value };
      });

    if (series.length === 0) {
      return [
        { date: "--", value: 0 },
        { date: "--", value: 0 },
      ];
    }

    if (series.length === 1) {
      return [series[0], series[0]];
    }

    return series;
  }, [items, language]);

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 26,
        border: "1px solid rgba(46, 74, 114, 0.72)",
        background:
          "radial-gradient(circle at 82% -20%, rgba(44, 211, 238, 0.16), transparent 42%), radial-gradient(circle at 14% 112%, rgba(56, 189, 248, 0.12), transparent 48%), linear-gradient(164deg, #090f1b 0%, #070e19 52%, #07121f 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 44px rgba(2, 6, 14, 0.5)",
        overflow: "hidden",
        position: "relative",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, rgba(34,211,238,0), rgba(34,211,238,0.4), rgba(34,211,238,0))",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "6px 14px",
              border: "1px solid rgba(83, 128, 185, 0.5)",
              background: "rgba(16, 30, 48, 0.72)",
              color: "#67e8f9",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            {language === "ru" ? "ДИНАМИКА ТОЧНОСТИ" : "ACCURACY TREND"}
          </div>
          <h3 style={{ color: "#ffffff", fontSize: 30, fontWeight: 700, marginTop: 14, lineHeight: 1.05 }}>
            {language === "ru" ? "Рабочая лента сигналов" : "Signal performance stream"}
          </h3>
          <p style={{ color: "#8fa3bc", fontSize: 14, marginTop: 6 }}>
            {language === "ru" ? "График построен по реальным результатам сигналов" : "Chart is based on real signal outcomes"}
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "#ffffff", fontSize: 56, lineHeight: 1, fontWeight: 800, letterSpacing: -2 }}>{stats.hitRate}%</div>
          <div style={{ color: "#22d3ee", marginTop: 4, fontSize: 13, fontWeight: 700 }}>
            {language === "ru" ? "СРЕДНЯЯ ТОЧНОСТЬ" : "AVERAGE ACCURACY"}
          </div>
        </div>
      </div>

      <div style={{ height: 282, margin: "0 -6px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 28, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="premiumArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.84} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
              <filter id="premiumGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22d3ee" floodOpacity="0.46" />
              </filter>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#5f738f", fontSize: 13 }}
              dy={12}
            />

            <Tooltip
              formatter={(value) => [`${value}%`, language === "ru" ? "Точность" : "Accuracy"]}
              labelFormatter={(value) => `${language === "ru" ? "Дата" : "Date"}: ${value}`}
              contentStyle={{
                backgroundColor: "#172237",
                border: "1px solid rgba(95, 136, 186, 0.4)",
                borderRadius: "12px",
                color: "#e2e8f0",
                padding: "10px 14px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.55)",
              }}
            />

            <Area
              type="natural"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={5}
              fill="url(#premiumArea)"
              filter="url(#premiumGlow)"
              dot={{ fill: "#0a0f1c", stroke: "#22d3ee", strokeWidth: 4, r: 6.5 }}
              activeDot={{ r: 9, fill: "#22d3ee", stroke: "#0a0f1c", strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginTop: 18,
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ color: "#34d399", fontSize: 30, fontWeight: 700 }}>{stats.won}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "Победы" : "Wins"}</div>
        </div>
        <div>
          <div style={{ color: "#f87171", fontSize: 30, fontWeight: 700 }}>{stats.lost}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "Поражения" : "Lost"}</div>
        </div>
        <div>
          <div style={{ color: "#fbbf24", fontSize: 30, fontWeight: 700 }}>{stats.refund}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "Возвраты" : "Refund"}</div>
        </div>
        <div>
          <div style={{ color: "#38bdf8", fontSize: 30, fontWeight: 700 }}>{stats.pending}</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "В ожидании" : "Pending"}</div>
        </div>
      </div>
    </div>
  );
}
