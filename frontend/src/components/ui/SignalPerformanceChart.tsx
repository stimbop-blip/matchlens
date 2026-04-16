import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const chartData = [
  { date: "03.04", value: 4 },
  { date: "04.04", value: 9 },
  { date: "05.04", value: 14 },
  { date: "05.04", value: 12 },
  { date: "06.04", value: 21 },
  { date: "06.04", value: 26 },
];

export function SignalPerformanceChart() {
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
          <h3 style={{ color: "#fff", fontSize: 34, fontWeight: 700, marginTop: 14, lineHeight: 1.04 }}>Рабочая лента сигналов</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>Прематч и лайв сигналы в рабочем формате</p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 50, fontWeight: 800, color: "#fff", letterSpacing: -1.5 }}>67%</div>
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
        <div><div style={{ color: "#34d399", fontSize: 28, fontWeight: 700 }}>2</div><div style={{ color: "#64748b", fontSize: 12 }}>Победы</div></div>
        <div><div style={{ color: "#f87171", fontSize: 28, fontWeight: 700 }}>0</div><div style={{ color: "#64748b", fontSize: 12 }}>Поражения</div></div>
        <div><div style={{ color: "#fbbf24", fontSize: 28, fontWeight: 700 }}>1</div><div style={{ color: "#64748b", fontSize: 12 }}>Возвраты</div></div>
        <div><div style={{ color: "#38bdf8", fontSize: 28, fontWeight: 700 }}>0</div><div style={{ color: "#64748b", fontSize: 12 }}>В ожидании</div></div>
      </div>
    </div>
  );
}
