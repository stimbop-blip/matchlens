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
      className="w-full bg-[#0f172a] rounded-3xl p-6 border border-[#1e2937] relative overflow-hidden"
      style={{
        width: "100%",
        background: "#0f172a",
        borderRadius: 24,
        padding: 24,
        border: "1px solid #1e2937",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="flex justify-between items-start mb-6" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <div
            className="inline-flex px-4 py-1.5 bg-[#1e2937] text-[#67e8f9] text-xs font-semibold rounded-2xl"
            style={{ display: "inline-flex", padding: "6px 16px", background: "#1e2937", color: "#67e8f9", fontSize: 12, fontWeight: 700, borderRadius: 16 }}
          >
            ДИНАМИКА ТОЧНОСТИ
          </div>
          <h3 className="text-white text-2xl font-semibold mt-4" style={{ color: "#ffffff", fontSize: 32, lineHeight: 1.12, fontWeight: 700, marginTop: 16 }}>
            Рабочая лента сигналов
          </h3>
          <p className="text-[#94a3b8] text-sm mt-1" style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.28, marginTop: 6 }}>
            Прематч и лайв сигналы в рабочем формате
          </p>
        </div>

        <div className="text-right" style={{ textAlign: "right", flex: "0 0 auto" }}>
          <div className="text-5xl font-bold text-white tracking-tighter" style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
            67%
          </div>
          <div className="text-[#22d3ee] text-sm mt-1" style={{ color: "#22d3ee", fontSize: 14, marginTop: 6 }}>
            СРЕДНЯЯ ТОЧНОСТЬ
          </div>
        </div>
      </div>

      <div className="h-[260px]" style={{ height: 260 }}>
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

      <div className="grid grid-cols-4 gap-4 mt-6 text-center" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 24, textAlign: "center" }}>
        <div><div className="text-emerald-400 text-2xl font-semibold" style={{ color: "#34d399", fontSize: 34, fontWeight: 700 }}>2</div><div className="text-xs text-[#64748b]" style={{ color: "#64748b", fontSize: 12 }}>Победы</div></div>
        <div><div className="text-red-400 text-2xl font-semibold" style={{ color: "#f87171", fontSize: 34, fontWeight: 700 }}>0</div><div className="text-xs text-[#64748b]" style={{ color: "#64748b", fontSize: 12 }}>Поражения</div></div>
        <div><div className="text-amber-400 text-2xl font-semibold" style={{ color: "#fbbf24", fontSize: 34, fontWeight: 700 }}>1</div><div className="text-xs text-[#64748b]" style={{ color: "#64748b", fontSize: 12 }}>Возвраты</div></div>
        <div><div className="text-sky-400 text-2xl font-semibold" style={{ color: "#38bdf8", fontSize: 34, fontWeight: 700 }}>0</div><div className="text-xs text-[#64748b]" style={{ color: "#64748b", fontSize: 12 }}>В ожидании</div></div>
      </div>
    </div>
  );
}
