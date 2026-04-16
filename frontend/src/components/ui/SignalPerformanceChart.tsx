import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { Prediction } from "../../services/api";

type SignalPerformanceChartProps = {
  items: Prediction[];
  language: "ru" | "en";
};

function shortDate(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

function predictionTime(item: Prediction): number {
  const parsed = new Date(item.published_at || item.event_start_at).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function SignalPerformanceChart({ items, language }: SignalPerformanceChartProps) {
  const wonCount = items.filter((item) => item.status === "won").length;
  const lostCount = items.filter((item) => item.status === "lost").length;
  const refundCount = items.filter((item) => item.status === "refund").length;
  const pendingCount = items.filter((item) => item.status === "pending").length;

  const settledCount = wonCount + lostCount + refundCount;
  const hitRate = settledCount > 0 ? Math.round((wonCount / settledCount) * 100) : 0;

  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => predictionTime(a) - predictionTime(b));
    const grouped = new Map<string, { date: string; won: number; lost: number; refund: number }>();

    sorted.forEach((item) => {
      const date = shortDate(item.event_start_at || item.published_at || "", language);
      if (!grouped.has(date)) {
        grouped.set(date, { date, won: 0, lost: 0, refund: 0 });
      }
      const day = grouped.get(date);
      if (!day) return;

      if (item.status === "won") day.won += 1;
      if (item.status === "lost") day.lost += 1;
      if (item.status === "refund") day.refund += 1;
    });

    let cumulativeWon = 0;
    let cumulativeLost = 0;
    let cumulativeRefund = 0;

    const series = Array.from(grouped.values()).slice(-6).map((day) => {
      cumulativeWon += day.won;
      cumulativeLost += day.lost;
      cumulativeRefund += day.refund;
      const settled = cumulativeWon + cumulativeLost + cumulativeRefund;
      const value = settled > 0 ? Math.round((cumulativeWon / settled) * 100) : 0;
      return {
        date: day.date,
        value,
      };
    });

    if (series.length === 0) {
      return [{ date: "--", value: 0 }];
    }

    if (series.length === 1) {
      return [
        { date: series[0].date, value: series[0].value },
        { date: series[0].date, value: series[0].value },
      ];
    }

    return series;
  }, [items, language]);

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(165deg, #0f172a, #0b1220)",
        borderRadius: 24,
        padding: 22,
        border: "1px solid #1e2937",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              background: "#1e2937",
              color: "#67e8f9",
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 999,
            }}
          >
            ДИНАМИКА ТОЧНОСТИ
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 10 }}>
            {language === "ru" ? "По реальным результатам последних сигналов" : "Based on real outcomes of recent signals"}
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 50, fontWeight: 800, color: "#fff", letterSpacing: -1.5 }}>{hitRate}%</div>
          <div style={{ color: "#22d3ee", fontSize: 12, marginTop: 2, fontWeight: 700 }}>СРЕДНЯЯ ТОЧНОСТЬ</div>
        </div>
      </div>

      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dy={10}
            />

            <Tooltip
              formatter={(value) => [`${value}%`, language === "ru" ? "Точность" : "Accuracy"]}
              labelFormatter={(value) => `${language === "ru" ? "Дата" : "Date"}: ${value}`}
              contentStyle={{
                backgroundColor: "#1e2937",
                border: "none",
                borderRadius: "14px",
                color: "#f1f5f9",
              }}
            />

            <Area
              type="natural"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={4.5}
              fill="url(#areaGrad)"
              dot={{ fill: "#0f172a", stroke: "#22d3ee", strokeWidth: 3.5, r: 6 }}
              activeDot={{ r: 8.5, fill: "#22d3ee", stroke: "#0f172a", strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 20, textAlign: "center" }}>
        <div><div style={{ color: "#34d399", fontSize: 28, fontWeight: 700 }}>{wonCount}</div><div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "Победы" : "Wins"}</div></div>
        <div><div style={{ color: "#f87171", fontSize: 28, fontWeight: 700 }}>{lostCount}</div><div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "Поражения" : "Lost"}</div></div>
        <div><div style={{ color: "#fbbf24", fontSize: 28, fontWeight: 700 }}>{refundCount}</div><div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "Возвраты" : "Refund"}</div></div>
        <div><div style={{ color: "#38bdf8", fontSize: 28, fontWeight: 700 }}>{pendingCount}</div><div style={{ color: "#64748b", fontSize: 12 }}>{language === "ru" ? "В ожидании" : "Pending"}</div></div>
      </div>
    </div>
  );
}
