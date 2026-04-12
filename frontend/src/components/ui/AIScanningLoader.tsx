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
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "light";
  });
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

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const applyTheme = () => {
      setIsLightTheme(root.getAttribute("data-theme") === "light");
    };

    applyTheme();

    const observer = new MutationObserver(applyTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scannerSize = compact ? 142 : 168;
  const coreSize = compact ? 58 : 68;
  const valueSize = compact ? 44 : 54;
  const labelSize = compact ? 12 : 14;
  const progressLabel = `${Math.round(progress)}%`;

  const palette = isLightTheme
      ? {
        panelBorder: "1px solid rgba(66, 128, 180, 0.34)",
        panelBackground: "#f6fbff",
        panelShadow: "0 18px 40px rgba(45, 87, 128, 0.14)",
        panelOverlay: "linear-gradient(145deg, #ffffff 0%, #f1f8ff 56%, #fbfdff 100%)",
        radarBorder: "1px solid rgba(72, 153, 211, 0.32)",
        radarBackground: "radial-gradient(circle at 50% 54%, rgba(245, 252, 255, 0.98) 0%, rgba(230, 244, 255, 0.99) 100%)",
        radarInset: "inset 0 0 26px rgba(82, 173, 224, 0.18)",
        ringSoft: "rgba(98, 152, 210, 0.3)",
        ringHard: "rgba(72, 180, 232, 0.42)",
        sweepStrong: "rgba(47, 179, 227, 0.9)",
        sweepSoft: "rgba(47, 179, 227, 0.26)",
        beamTop: "rgba(20, 166, 216, 0.82)",
        beamMid: "rgba(20, 166, 216, 0.38)",
        beamGlow: "0 0 14px rgba(52, 179, 226, 0.56)",
        dotFill: "rgba(42, 172, 217, 0.94)",
        dotGlow: "0 0 8px rgba(42, 172, 217, 0.44)",
        coreFill: "linear-gradient(145deg, #36c8ea 0%, #2aafe0 55%, #2e8dcb 100%)",
        corePulseA: "0 0 34px rgba(50, 176, 228, 0.42)",
        corePulseB: "0 0 58px rgba(50, 176, 228, 0.76)",
        coreInner: "#ffffff",
        valueColor: "#163a61",
        valueShadow: "0 0 18px rgba(98, 190, 237, 0.28)",
        labelColor: "#4c7097",
        trackColor: "#d6e5f4",
        barGradient: "linear-gradient(90deg, #25c6db 0%, #4487f2 100%)",
        progressColor: "#6280a3",
        statusColor: "#2b84af",
      }
    : {
        panelBorder: "1px solid rgba(31, 41, 55, 0.8)",
        panelBackground: "#0a0b14",
        panelShadow: "0 24px 52px rgba(0, 0, 0, 0.5)",
        panelOverlay: "linear-gradient(140deg, #0a0b14 0%, #111827 48%, #0a0b14 100%)",
        radarBorder: "1px solid rgba(82, 190, 228, 0.26)",
        radarBackground: "radial-gradient(circle at 50% 54%, rgba(8, 25, 43, 0.9) 0%, rgba(2, 8, 16, 0.98) 100%)",
        radarInset: "inset 0 0 26px rgba(52, 177, 214, 0.18)",
        ringSoft: "rgba(86, 151, 212, 0.2)",
        ringHard: "rgba(112, 222, 255, 0.28)",
        sweepStrong: "rgba(75, 234, 255, 0.82)",
        sweepSoft: "rgba(75, 234, 255, 0.22)",
        beamTop: "rgba(165, 243, 252, 0.96)",
        beamMid: "rgba(81, 221, 255, 0.54)",
        beamGlow: "0 0 16px rgba(124, 242, 255, 0.76)",
        dotFill: "rgba(162, 240, 255, 0.95)",
        dotGlow: "0 0 10px rgba(162, 240, 255, 0.85)",
        coreFill: "linear-gradient(145deg, #22d3ee 0%, #06b6d4 55%, #0891b2 100%)",
        corePulseA: "0 0 42px rgba(34, 211, 238, 0.48)",
        corePulseB: "0 0 72px rgba(34, 211, 238, 0.95)",
        coreInner: "#09121f",
        valueColor: "#f7fbff",
        valueShadow: "0 0 24px rgba(110, 223, 255, 0.34)",
        labelColor: "#9eb5cc",
        trackColor: "#1f2937",
        barGradient: "linear-gradient(90deg, #22d3ee 0%, #67e8f9 100%)",
        progressColor: "#64748b",
        statusColor: "#67e8f9",
      };

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
          border: palette.panelBorder,
          background: palette.panelBackground,
          boxShadow: palette.panelShadow,
          padding: compact ? "24px 20px" : "36px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: palette.panelOverlay,
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: scannerSize, height: scannerSize, marginBottom: compact ? 28 : 34 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                border: palette.radarBorder,
                background: palette.radarBackground,
                boxShadow: palette.radarInset,
              }}
            />

            {[0, 16, 32].map((inset, idx) => (
              <motion.div
                key={inset}
                style={{
                  position: "absolute",
                  inset,
                  borderRadius: "999px",
                  border: `1px solid ${idx === 1 ? palette.ringHard : palette.ringSoft}`,
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
                  `conic-gradient(from 0deg, ${palette.sweepStrong} 0deg, ${palette.sweepSoft} 54deg, rgba(0, 0, 0, 0) 128deg, rgba(0, 0, 0, 0) 360deg)`,
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
                    `linear-gradient(180deg, ${palette.beamTop} 0%, ${palette.beamMid} 56%, rgba(0, 0, 0, 0) 100%)`,
                  boxShadow: palette.beamGlow,
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
                  background: palette.dotFill,
                  boxShadow: palette.dotGlow,
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
                  background: palette.coreFill,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: palette.corePulseB,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    palette.corePulseA,
                    palette.corePulseB,
                    palette.corePulseA,
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div
                  style={{
                    width: compact ? 18 : 24,
                    height: compact ? 18 : 24,
                    borderRadius: "999px",
                    background: palette.coreInner,
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
                color: palette.valueColor,
                fontFamily: "Satoshi, Manrope, Segoe UI, sans-serif",
                fontSize: valueSize,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: -1.1,
                fontVariantNumeric: "tabular-nums",
                textShadow: palette.valueShadow,
              }}
            >
              {matchCount.toLocaleString("ru-RU")}
            </motion.div>
          </AnimatePresence>

          <p
            style={{
              margin: "4px 0 0",
              color: palette.labelColor,
              fontSize: labelSize,
              fontWeight: 600,
              letterSpacing: 0.9,
              fontFamily: "Satoshi, Manrope, Segoe UI, sans-serif",
            }}
          >
            МАТЧЕЙ В РЕАЛЬНОМ ВРЕМЕНИ
          </p>

          <div style={{ width: "100%", maxWidth: compact ? 220 : 260, marginTop: compact ? 20 : 32 }}>
            <div style={{ height: 1, background: palette.trackColor, position: "relative" }}>
              <motion.div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: 1,
                  background: palette.barGradient,
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
                color: palette.progressColor,
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
                color: palette.statusColor,
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
