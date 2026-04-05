import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function nextDelayMs() {
  return 1800 + Math.floor(Math.random() * 1001);
}

function nextValue(previous: number, direction: 1 | -1) {
  const step = 2 + Math.floor(Math.random() * 8);
  const drift = Math.random() < 0.14 ? direction * 4 : 0;
  const noise = Math.floor(Math.random() * 5) - 2;
  const candidate = previous + direction * step + drift + noise;
  return Math.min(1420, Math.max(1180, candidate));
}

export function AIScanningLoader({
  className,
  compact = false,
  fullscreen = false,
}: {
  className?: string;
  compact?: boolean;
  fullscreen?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [value, setValue] = useState(1298);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    let active = true;
    let timer = 0 as unknown as ReturnType<typeof setTimeout>;

    const tick = () => {
      timer = setTimeout(() => {
        if (!active) return;
        setStep((prev) => prev + 1);
        setValue((prev) => {
          if (prev >= 1412) directionRef.current = -1;
          if (prev <= 1188) directionRef.current = 1;
          if (Math.random() < 0.26) directionRef.current = directionRef.current === 1 ? -1 : 1;
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

  const ringDelays = useMemo(() => [0, 0.16, 0.32, 0.48], []);

  return (
    <div className={cx("pb-ai-loader", compact && "compact", fullscreen && "fullscreen", className)} role="status" aria-live="polite">
      <div className="pb-ai-loader-panel">
        <div className="pb-ai-radar" aria-hidden="true">
          {ringDelays.map((delay, index) => (
            <motion.span
              key={index}
              className="pb-ai-ring"
              animate={{ rotate: 360, scale: [1, 1.035, 1] }}
              transition={{ repeat: Infinity, duration: 5.8 - index * 0.7, ease: "linear", delay }}
            />
          ))}
          <motion.span
            className="pb-ai-scan-line"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
          />
          <motion.span
            className="pb-ai-orb"
            animate={{ boxShadow: ["0 0 14px rgba(96, 245, 255, 0.45)", "0 0 26px rgba(96, 245, 255, 0.92)", "0 0 14px rgba(96, 245, 255, 0.45)"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>

        <p className="pb-ai-title">ИИ анализирует</p>

        <div className="pb-ai-number-wrap">
          <AnimatePresence mode="wait">
            <motion.strong
              key={value}
              className="pb-ai-number"
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.62, ease: "easeOut" }}
            >
              {value.toLocaleString("ru-RU")}
            </motion.strong>
          </AnimatePresence>
        </div>

        <p className="pb-ai-subtitle">матчей в реальном времени</p>
      </div>
    </div>
  );
}
