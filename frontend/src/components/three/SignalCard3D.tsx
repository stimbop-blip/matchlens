import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function SignalCard3D({
  to,
  signal,
}: {
  to: string;
  signal: {
    confidence: number;
    mode: "live" | "prematch";
    match_name: string;
    league: string | null;
    odds: number;
    bet_type: string;
  };
}) {
  const isHighConfidence = signal.confidence >= 85;

  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Link
        to={to}
        className={`block bg-[#1a2333] border rounded-3xl overflow-hidden shadow-xl transition-all ${
          isHighConfidence ? "border-[#00f5d4] shadow-[0_0_0_4px_rgba(0,245,212,0.25)]" : "border-transparent"
        }`}
      >
        <div className="h-44 bg-gradient-to-br from-[#1e2a44] to-[#0f172a] flex items-center justify-center relative">
          <div className="text-[#00f5d4] text-[92px] opacity-20">
            <Zap />
          </div>

          <div className="absolute top-4 left-4 px-4 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-2xl flex items-center gap-1">
            <Clock size={14} />
            {signal.mode === "live" ? "Лайв" : "Прематч"}
          </div>

          {isHighConfidence && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-[#00f5d4] text-black text-xs font-bold rounded-2xl">{signal.confidence}%</div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-semibold text-white line-clamp-2">{signal.match_name}</h3>

          <p className="text-[#8ca4c8] text-sm mt-1">{signal.league || "Лига не указана"}</p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-[#00f5d4] text-3xl font-bold">{signal.odds}</span>
              <span className="text-[#8ca4c8] text-xs ml-1">кэф</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#8ca4c8]">Ставка</span>
              <p className="text-white font-medium text-sm">{signal.bet_type}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
