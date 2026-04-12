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
    <div className="w-full bg-[#0f172a] rounded-3xl p-6 border border-[#1e2937] relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="inline-flex px-4 py-1.5 bg-[#1e2937] text-[#67e8f9] text-xs font-semibold rounded-2xl">
            ДИНАМИКА ТОЧНОСТИ
          </div>
          <h3 className="text-white text-2xl font-semibold mt-4">Рабочая лента сигналов</h3>
          <p className="text-[#94a3b8] text-sm mt-1">Прематч и лайв сигналы в рабочем формате</p>
        </div>

        <div className="text-right">
          <div className="text-5xl font-bold text-white tracking-tighter">67%</div>
          <div className="text-[#22d3ee] text-sm font-medium mt-1">СРЕДНЯЯ ТОЧНОСТЬ</div>
        </div>
      </div>

      <div className="h-[260px]">
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
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
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

      <div className="grid grid-cols-4 gap-4 mt-6 text-center">
        <div>
          <div className="text-emerald-400 text-2xl font-semibold">2</div>
          <div className="text-[#64748b] text-xs">Победы</div>
        </div>
        <div>
          <div className="text-red-400 text-2xl font-semibold">0</div>
          <div className="text-[#64748b] text-xs">Поражения</div>
        </div>
        <div>
          <div className="text-amber-400 text-2xl font-semibold">1</div>
          <div className="text-[#64748b] text-xs">Возвраты</div>
        </div>
        <div>
          <div className="text-sky-400 text-2xl font-semibold">0</div>
          <div className="text-[#64748b] text-xs">В ожидании</div>
        </div>
      </div>
    </div>
  );
}
