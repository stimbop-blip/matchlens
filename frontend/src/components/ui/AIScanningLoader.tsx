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
  const [statusText, setStatusText] = useState(STATUSES[0]);
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
      className={className}
      style={{
        width: "100%",
        minHeight: fullscreen ? "100vh" : undefined,
        display: "grid",
        placeItems: "center",
        padding: fullscreen ? 18 : 0,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: "100%",
          maxWidth: compact ? 330 : 380,
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          borderRadius: compact ? 20 : 24,
          border: "1px solid rgba(31, 41, 55, 0.8)",
          background: "#0a0b14",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.45)",
          padding: compact ? "24px 20px" : "36px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(140deg, #0a0b14 0%, #111827 48%, #0a0b14 100%)",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: scannerSize, height: scannerSize, marginBottom: 36 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                border: "4px solid rgba(34, 211, 238, 0.2)",
              }}
            />

            <motion.div
              style={{
                position: "absolute",
                inset: compact ? 12 : 14,
                borderRadius: "999px",
                border: "3px solid rgba(103, 232, 249, 0.3)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              style={{
                position: "absolute",
                inset: compact ? 24 : 28,
                borderRadius: "999px",
                border: "2.5px solid #22d3ee",
                boxShadow: "0 0 35px #22d3ee",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.div
                style={{
                  width: coreSize,
                  height: coreSize,
                  borderRadius: "999px",
                  background: "linear-gradient(145deg, #22d3ee 0%, #06b6d4 55%, #0891b2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 70px #22d3ee",
                }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                <div
                  style={{
                    width: compact ? 18 : 24,
                    height: compact ? 18 : 24,
                    borderRadius: "999px",
                    background: "#0a0b14",
                  }}
                />
              </motion.div>
            </div>

            <motion.div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: 1,
                height: "100%",
                transformOrigin: "top center",
                background: "linear-gradient(180deg, transparent 0%, #a5f3fc 50%, transparent 100%)",
              }}
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
              style={{
                color: "#ffffff",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: compact ? 44 : 52,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: -1.5,
              }}
            >
              {matchCount.toLocaleString("ru-RU")}
            </motion.div>
          </AnimatePresence>

          <p
            style={{
              margin: "4px 0 0",
              color: "#94a3b8",
              fontSize: compact ? 13 : 15,
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            МАТЧЕЙ В РЕАЛЬНОМ ВРЕМЕНИ
          </p>

          <div style={{ width: "100%", maxWidth: compact ? 220 : 260, marginTop: compact ? 20 : 32 }}>
            <div style={{ height: 1, background: "#1f2937", position: "relative" }}>
              <motion.div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: 1,
                  background: "linear-gradient(90deg, #22d3ee 0%, #67e8f9 100%)",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2 }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                color: "#64748b",
                fontSize: 11,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              }}
            >
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
              style={{
                margin: `${compact ? 22 : 28}px 0 0`,
                color: "#67e8f9",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 0.9,
              }}
            >
              {statusText}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
