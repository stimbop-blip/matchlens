import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

const BASE_SEQUENCE = [874, 1123, 1378, 1567, 1894, 2143, 2388, 2617, 2896, 3142];

function nextDelayMs() {
  return 400 + Math.floor(Math.random() * 201);
}

function nextValue(index: number) {
  const base = BASE_SEQUENCE[index % BASE_SEQUENCE.length];
  const jitter = Math.floor(Math.random() * 31) - 15;
  return Math.max(700, base + jitter);
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
  const [value, setValue] = useState(BASE_SEQUENCE[0]);

  useEffect(() => {
    let active = true;
    let timer = 0 as unknown as ReturnType<typeof setTimeout>;

    const tick = () => {
      timer = setTimeout(() => {
        if (!active) return;
        setStep((prev) => {
          const nextStep = prev + 1;
          setValue(nextValue(nextStep));
          return nextStep;
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
              transition={{ duration: 0.28, ease: "easeOut" }}
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
