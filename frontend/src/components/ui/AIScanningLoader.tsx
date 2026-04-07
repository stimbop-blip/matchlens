import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function nextDelayMs() {
  return 2400 + Math.floor(Math.random() * 1201);
}

function nextValue(previous: number, direction: 1 | -1) {
  const step = 10 + Math.floor(Math.random() * 26);
  const drift = Math.random() < 0.24 ? direction * (7 + Math.floor(Math.random() * 12)) : 0;
  const noise = Math.floor(Math.random() * 7) - 3;
  const candidate = previous + direction * step + drift + noise;
  return Math.min(2780, Math.max(1680, candidate));
}

type Particle = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
};

export function AIScanningLoader({
  className,
  compact = false,
  fullscreen = false,
}: {
  className?: string;
  compact?: boolean;
  fullscreen?: boolean;
}) {
  const [value, setValue] = useState(1942);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    let active = true;
    let timer = 0 as unknown as ReturnType<typeof setTimeout>;

    const tick = () => {
      timer = setTimeout(() => {
        if (!active) return;

        setValue((prev) => {
          if (prev >= 2740) directionRef.current = -1;
          if (prev <= 1720) directionRef.current = 1;
          if (Math.random() < 0.16) directionRef.current = directionRef.current === 1 ? -1 : 1;
          return nextValue(prev, directionRef.current);
        });

        tick();
      }, nextDelayMs());
    };

    tick();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const radarSize = compact ? 228 : 284;
  const ringSizes = compact ? [208, 172, 136, 100, 64] : [256, 214, 172, 130, 88];

  const particles = useMemo<Particle[]>(
    () => [
      { x: 14, y: 28, size: 3, delay: 0.2, duration: 5.6, driftX: 7, driftY: -4 },
      { x: 28, y: 16, size: 2, delay: 1.1, duration: 6.2, driftX: 4, driftY: 6 },
      { x: 43, y: 10, size: 3, delay: 2.4, duration: 5.9, driftX: -6, driftY: 4 },
      { x: 68, y: 13, size: 2, delay: 1.7, duration: 6.4, driftX: -4, driftY: 7 },
      { x: 84, y: 26, size: 3, delay: 2.9, duration: 6.1, driftX: -8, driftY: -3 },
      { x: 90, y: 48, size: 2, delay: 0.8, duration: 5.4, driftX: -5, driftY: -6 },
      { x: 82, y: 72, size: 3, delay: 1.9, duration: 6.0, driftX: -7, driftY: -4 },
      { x: 62, y: 88, size: 2, delay: 2.6, duration: 5.8, driftX: 4, driftY: -7 },
      { x: 36, y: 90, size: 3, delay: 0.4, duration: 6.3, driftX: 6, driftY: -5 },
      { x: 18, y: 76, size: 2, delay: 1.3, duration: 5.7, driftX: 8, driftY: -2 },
      { x: 9, y: 54, size: 2, delay: 2.1, duration: 6.5, driftX: 6, driftY: 3 },
      { x: 11, y: 40, size: 3, delay: 3.0, duration: 5.5, driftX: 5, driftY: 4 },
    ],
    [],
  );

  return (
    <div
      className={cx("pb-ai-loader-v3", compact && "compact", fullscreen && "fullscreen", className)}
      role="status"
      aria-live="polite"
      style={{
        width: "100%",
        minHeight: fullscreen ? "100vh" : undefined,
        display: "grid",
        placeItems: "center",
        padding: fullscreen ? 20 : 10,
      }}
    >
      <section
        style={{
          width: compact ? "min(460px, 100%)" : "min(620px, 100%)",
          borderRadius: 28,
          border: "1px solid rgba(104, 140, 182, 0.2)",
          background:
            "radial-gradient(circle at 80% -22%, rgba(91, 179, 255, 0.14), transparent 54%), radial-gradient(circle at 10% 116%, rgba(56, 111, 255, 0.12), transparent 60%), linear-gradient(164deg, #040915 0%, #030814 56%, #02060f 100%)",
          boxShadow: "0 28px 60px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          padding: compact ? "16px 14px 14px" : "22px 18px 18px",
          display: "grid",
          justifyItems: "center",
          gap: compact ? 8 : 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(136, 175, 221, 0.08) 1px, transparent 1px), linear-gradient(rgba(136, 175, 221, 0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(circle at 50% 48%, black 28%, transparent 88%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            width: radarSize,
            height: radarSize,
            display: "grid",
            placeItems: "center",
          }}
          aria-hidden="true"
        >
          {ringSizes.map((size, index) => (
            <motion.span
              key={size}
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "999px",
                border: `1px solid ${index % 2 === 0 ? "rgba(134, 226, 255, 0.26)" : "rgba(122, 171, 255, 0.18)"}`,
                boxShadow: index === 0 ? "inset 0 0 44px rgba(78, 177, 255, 0.12)" : "none",
              }}
              animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.01, 1], rotate: [0, 360] }}
              transition={{
                opacity: { duration: 4.8 + index * 0.6, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 5.6 + index * 0.7, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 42 + index * 8, repeat: Infinity, ease: "linear" },
              }}
            />
          ))}

          <motion.span
            style={{
              position: "absolute",
              width: 2,
              height: compact ? 108 : 132,
              top: compact ? 6 : 10,
              left: "calc(50% - 1px)",
              transformOrigin: `50% ${compact ? 108 : 132}px`,
              borderRadius: 999,
              background: "linear-gradient(180deg, rgba(156, 255, 248, 0.98), rgba(120, 238, 255, 0.42), rgba(120, 238, 255, 0))",
              boxShadow: "0 0 14px rgba(139, 245, 255, 0.82)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8.8, repeat: Infinity, ease: "linear" }}
          />

          {particles.map((p, i) => (
            <motion.span
              key={i}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: 999,
                background: "rgba(181, 241, 255, 0.95)",
                boxShadow: "0 0 10px rgba(181, 241, 255, 0.9)",
              }}
              animate={{
                opacity: [0, 0.95, 0],
                scale: [0.6, 1.15, 0.75],
                x: [0, p.driftX],
                y: [0, p.driftY],
              }}
              transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            />
          ))}

          <motion.span
            style={{
              position: "absolute",
              width: compact ? 22 : 24,
              height: compact ? 22 : 24,
              borderRadius: "999px",
              background: "radial-gradient(circle, #ffffff 0%, #a9f7ff 44%, #70d7ff 74%, #49b9ff 100%)",
            }}
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                "0 0 20px rgba(119, 233, 255, 0.48)",
                "0 0 38px rgba(119, 233, 255, 0.96)",
                "0 0 20px rgba(119, 233, 255, 0.48)",
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <p
          style={{
            margin: 0,
            color: "#e0ecf8",
            fontFamily: "Manrope, Segoe UI, sans-serif",
            fontWeight: 700,
            fontSize: compact ? 16 : 18,
            letterSpacing: 0.34,
          }}
        >
          ИИ анализирует
        </p>

        <div style={{ minHeight: compact ? 54 : 62, display: "grid", placeItems: "center" }}>
          <AnimatePresence mode="wait">
            <motion.strong
              key={value}
              style={{
                color: "#f4f9ff",
                fontFamily: "Manrope, Segoe UI, sans-serif",
                fontWeight: 800,
                fontSize: compact ? 44 : 56,
                lineHeight: 1,
                letterSpacing: 0.44,
                textShadow: "0 0 24px rgba(102, 218, 255, 0.38)",
              }}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.74, ease: "easeOut" }}
            >
              {value.toLocaleString("ru-RU")}
            </motion.strong>
          </AnimatePresence>
        </div>

        <p
          style={{
            margin: 0,
            color: "#9cb4cb",
            fontFamily: "Manrope, Segoe UI, sans-serif",
            fontWeight: 600,
            fontSize: compact ? 13 : 14,
            letterSpacing: 0.24,
            textShadow: "0 0 9px rgba(108, 204, 255, 0.22)",
          }}
        >
          матчей в реальном времени
        </p>
      </section>
    </div>
  );
}
