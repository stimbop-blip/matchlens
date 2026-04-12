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

const MIN_MATCHES = 1240;
const MAX_MATCHES = 2970;
const MIN_PROGRESS = 42;
const MAX_PROGRESS = 98;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nextStatus(current: string): string {
  if (STATUSES.length <= 1) return current;
  let candidate = current;
  while (candidate === current) {
    candidate = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  }
  return candidate;
}

export function AIScanningLoader({ className = "", compact = false, fullscreen = false }: AIScanningLoaderProps) {
  const [matchCount, setMatchCount] = useState(1842);
  const [statusText, setStatusText] = useState(STATUSES[0]);
  const [progress, setProgress] = useState(67.2);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countFlowRef = useRef<1 | -1>(1);
  const progressFlowRef = useRef<1 | -1>(1);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMatchCount((prev) => {
        if (prev >= MAX_MATCHES - 26) countFlowRef.current = -1;
        if (prev <= MIN_MATCHES + 26) countFlowRef.current = 1;
        if (Math.random() < 0.12) {
          countFlowRef.current = countFlowRef.current === 1 ? -1 : 1;
        }

        const base = countFlowRef.current * (1 + Math.floor(Math.random() * 4));
        const jitter = Math.floor(Math.random() * 5) - 2;
        const burst = Math.random() < 0.14 ? countFlowRef.current * (3 + Math.floor(Math.random() * 7)) : 0;
        const next = clamp(prev + base + jitter + burst, MIN_MATCHES, MAX_MATCHES);
        return Math.round(next);
      });

      setProgress((prev) => {
        if (prev >= MAX_PROGRESS - 1.2) progressFlowRef.current = -1;
        if (prev <= MIN_PROGRESS + 6) progressFlowRef.current = 1;
        if (Math.random() < 0.1) {
          progressFlowRef.current = progressFlowRef.current === 1 ? -1 : 1;
        }

        const drift = progressFlowRef.current * (0.35 + Math.random() * 0.85);
        const jitter = Math.random() * 0.3 - 0.15;
        const next = clamp(prev + drift + jitter, MIN_PROGRESS, MAX_PROGRESS);
        return Number(next.toFixed(1));
      });

      if (Math.random() < 0.14) {
        setStatusText((prev) => nextStatus(prev));
      }
    }, 1850);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const scannerSize = compact ? 142 : 168;
  const coreSize = compact ? 58 : 68;
  const valueSize = compact ? 44 : 54;
  const labelSize = compact ? 12 : 14;
  const progressLabel = `${Math.round(progress)}%`;

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
          boxShadow: "0 24px 52px rgba(0, 0, 0, 0.5)",
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
          <div style={{ position: "relative", width: scannerSize, height: scannerSize, marginBottom: compact ? 28 : 34 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                border: "1px solid rgba(82, 190, 228, 0.26)",
                background: "radial-gradient(circle at 50% 54%, rgba(8, 25, 43, 0.9) 0%, rgba(2, 8, 16, 0.98) 100%)",
                boxShadow: "inset 0 0 26px rgba(52, 177, 214, 0.18)",
              }}
            />

            {[0, 16, 32].map((inset, idx) => (
              <motion.div
                key={inset}
                style={{
                  position: "absolute",
                  inset,
                  borderRadius: "999px",
                  border: `1px solid ${idx === 1 ? "rgba(112, 222, 255, 0.28)" : "rgba(86, 151, 212, 0.2)"}`,
                }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.01, 1] }}
                transition={{ duration: 4.2 + idx * 0.8, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}

            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                background:
                  "conic-gradient(from 0deg, rgba(75, 234, 255, 0.82) 0deg, rgba(75, 234, 255, 0.22) 54deg, rgba(75, 234, 255, 0) 128deg, rgba(75, 234, 255, 0) 360deg)",
                WebkitMaskImage:
                  "radial-gradient(circle, transparent 0%, transparent 42%, black 49%, black 73%, transparent 79%, transparent 100%)",
                maskImage: "radial-gradient(circle, transparent 0%, transparent 42%, black 49%, black 73%, transparent 79%, transparent 100%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4.7, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.9, repeat: Infinity, ease: "linear" }}
            >
              <span
                style={{
                  width: 2,
                  height: "43%",
                  transform: "translateY(-50%)",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(180deg, rgba(165, 243, 252, 0.96) 0%, rgba(81, 221, 255, 0.54) 56%, rgba(81, 221, 255, 0) 100%)",
                  boxShadow: "0 0 16px rgba(124, 242, 255, 0.76)",
                }}
              />
            </motion.div>

            {[
              { left: "22%", top: "38%", delay: 0.2 },
              { left: "72%", top: "30%", delay: 1.2 },
              { left: "66%", top: "68%", delay: 0.8 },
              { left: "34%", top: "74%", delay: 1.8 },
            ].map((dot) => (
              <motion.span
                key={`${dot.left}${dot.top}`}
                style={{
                  position: "absolute",
                  left: dot.left,
                  top: dot.top,
                  width: compact ? 5 : 6,
                  height: compact ? 5 : 6,
                  marginLeft: compact ? -2.5 : -3,
                  marginTop: compact ? -2.5 : -3,
                  borderRadius: "999px",
                  background: "rgba(162, 240, 255, 0.95)",
                  boxShadow: "0 0 10px rgba(162, 240, 255, 0.85)",
                }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.16, 0.86] }}
                transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: dot.delay }}
              />
            ))}

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
                  boxShadow: "0 0 62px rgba(34, 211, 238, 0.9)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 42px rgba(34, 211, 238, 0.48)",
                    "0 0 72px rgba(34, 211, 238, 0.95)",
                    "0 0 42px rgba(34, 211, 238, 0.48)",
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div
                  style={{
                    width: compact ? 18 : 24,
                    height: compact ? 18 : 24,
                    borderRadius: "999px",
                    background: "#09121f",
                  }}
                />
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={matchCount}
              initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, filter: "blur(4px)" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              style={{
                color: "#f7fbff",
                fontFamily: "Satoshi, Manrope, Segoe UI, sans-serif",
                fontSize: valueSize,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: -1.1,
                fontVariantNumeric: "tabular-nums",
                textShadow: "0 0 24px rgba(110, 223, 255, 0.34)",
              }}
            >
              {matchCount.toLocaleString("ru-RU")}
            </motion.div>
          </AnimatePresence>

          <p
            style={{
              margin: "4px 0 0",
              color: "#9eb5cc",
              fontSize: labelSize,
              fontWeight: 600,
              letterSpacing: 0.9,
              fontFamily: "Satoshi, Manrope, Segoe UI, sans-serif",
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
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                color: "#64748b",
                fontSize: 11,
                fontFamily: "Manrope, Segoe UI, sans-serif",
                letterSpacing: 0.28,
              }}
            >
              <span>ОБРАБОТКА</span>
              <span>{progressLabel}</span>
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
                fontFamily: "Satoshi, Manrope, Segoe UI, sans-serif",
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
