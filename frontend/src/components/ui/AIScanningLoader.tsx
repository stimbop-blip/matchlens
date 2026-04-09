import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AIScanningLoaderProps = {
  className?: string;
  compact?: boolean;
  fullscreen?: boolean;
};

const STATUSES = [
  "ИИ сканирует live-данные",
  "Синхронизация с букмекерами",
  "Анализ движения коэффициентов",
  "Обработка исторической статистики",
  "Сравнение моделей предсказания",
  "Выявление ценности ставок",
];

export function AIScanningLoader({ className = "", compact = false, fullscreen = false }: AIScanningLoaderProps) {
  const [matchCount, setMatchCount] = useState(1842);
  const [statusText, setStatusText] = useState("ИИ сканирует live-данные");
  const [progress, setProgress] = useState(67);
  const countInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    countInterval.current = setInterval(() => {
      setMatchCount((prev) => {
        const variance = Math.floor(Math.random() * 13) - 6;
        const next = prev + variance;
        if (next < 1240) return 1240;
        if (next > 2970) return 2970;
        return next;
      });

      if (Math.random() < 0.12) {
        setStatusText(STATUSES[Math.floor(Math.random() * STATUSES.length)]);
      }

      setProgress((prev) => {
        const change = Math.random() < 0.7 ? 1 : -2;
        return Math.min(98, Math.max(42, prev + change));
      });
    }, 1600);

    return () => {
      if (countInterval.current) {
        clearInterval(countInterval.current);
      }
    };
  }, []);

  const scannerSize = compact ? 142 : 168;
  const coreSize = compact ? 58 : 68;

  return (
    <div
      className={`w-full ${fullscreen ? "min-h-screen" : ""} ${className}`}
      style={{ display: "grid", placeItems: "center", padding: fullscreen ? 18 : 0 }}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative w-full mx-auto overflow-hidden bg-[#0a0b14] border border-[#1f2937]/80 shadow-2xl"
        style={{
          maxWidth: compact ? 330 : 380,
          borderRadius: compact ? 20 : 24,
          padding: compact ? "24px 20px" : "36px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b14] via-[#111827] to-[#0a0b14]" />

        <div className="relative flex flex-col items-center">
          <div className="relative mb-10" style={{ width: scannerSize, height: scannerSize }}>
            <div className="absolute inset-0 border-[4px] border-[#22d3ee]/20 rounded-full" />

            <motion.div
              className="absolute border-[3px] border-[#67e8f9]/30 rounded-full"
              style={{ inset: compact ? 12 : 14 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              className="absolute border-[2.5px] border-[#22d3ee] rounded-full shadow-[0_0_35px_#22d3ee]"
              style={{ inset: compact ? 24 : 28 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="bg-gradient-to-br from-[#22d3ee] via-[#06b6d4] to-[#0891b2] rounded-full flex items-center justify-center shadow-[0_0_70px_#22d3ee]"
                style={{ width: coreSize, height: coreSize }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                <div className="bg-[#0a0b14] rounded-full" style={{ width: compact ? 18 : 24, height: compact ? 18 : 24 }} />
              </motion.div>
            </div>

            <motion.div
              className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#a5f3fc] to-transparent"
              style={{ transformOrigin: "top center" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={matchCount}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="text-white tracking-[-1.5px] font-mono"
              style={{ fontSize: compact ? 44 : 52, fontWeight: 600, lineHeight: 1 }}
            >
              {matchCount.toLocaleString("ru-RU")}
            </motion.div>
          </AnimatePresence>

          <p className="text-[#94a3b8] tracking-[1px] font-medium" style={{ fontSize: compact ? 13 : 15, marginTop: 4 }}>
            МАТЧЕЙ В РЕАЛЬНОМ ВРЕМЕНИ
          </p>

          <div className="w-full" style={{ maxWidth: compact ? 220 : 260, marginTop: compact ? 20 : 32 }}>
            <div className="h-px bg-[#1f2937] relative">
              <motion.div
                className="absolute left-0 top-0 h-px bg-gradient-to-r from-[#22d3ee] to-[#67e8f9]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2 }}
              />
            </div>

            <div className="flex justify-between text-[#64748b] mt-1.5 font-mono" style={{ fontSize: 11 }}>
              <span>ОБРАБОТКА</span>
              <span>{progress}%</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={statusText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[#67e8f9] font-medium tracking-wider"
              style={{ marginTop: compact ? 22 : 28, fontSize: 14 }}
            >
              {statusText}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
