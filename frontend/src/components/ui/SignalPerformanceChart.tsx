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
    <div className="w-full bg-[#0f172a] rounded-3xl p-6 border border-[#1e2937]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="inline-flex px-4 py-1.5 bg-[#1e2937] text-[#67e8f9] text-xs font-semibold rounded-2xl">
            ДИНАМИКА ТОЧНОСТИ
          </div>
          <h3 className="text-white text-2xl font-semibold mt-4">Рабочая лента сигналов</h3>
          <p className="text-[#94a3b8] text-sm mt-1">Прематч и лайв сигналы в рабочем формате</p>
        </div>

        <div className="text-right">
          <div className="text-5xl font-bold text-white">67%</div>
          <div className="text-[#22d3ee] text-sm">СРЕДНЯЯ ТОЧНОСТЬ</div>
        </div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1e2937",
                border: "none",
                borderRadius: "12px",
              }}
            />

            <Area
              type="natural"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={4}
              fill="url(#grad)"
              dot={{ fill: "#0f172a", stroke: "#22d3ee", r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6 text-center">
        <div><div className="text-emerald-400 text-2xl font-semibold">2</div><div className="text-xs text-[#64748b]">Победы</div></div>
        <div><div className="text-red-400 text-2xl font-semibold">0</div><div className="text-xs text-[#64748b]">Поражения</div></div>
        <div><div className="text-amber-400 text-2xl font-semibold">1</div><div className="text-xs text-[#64748b]">Возвраты</div></div>
        <div><div className="text-sky-400 text-2xl font-semibold">0</div><div className="text-xs text-[#64748b]">В ожидании</div></div>
      </div>
    </div>
  );
}
