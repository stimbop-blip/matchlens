import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LiveScannerProps = {
  language?: "ru" | "en";
};

/**
 * Живой AI-сканер для главной страницы.
 * Показывает реалистичный процесс анализа матчей:
 * - Анимированная волна/эквалайзер
 * - Меняющиеся метрики (кэфы, %, матчи)
 * - Прогресс-этапы анализа
 * Не зависит от бэкенда — всегда виден.
 */
const STAGES_RU = [
  { label: "Сканирование линий", icon: "📡" },
  { label: "Анализ коэффициентов", icon: "📊" },
  { label: "Расчёт вероятностей", icon: "🧮" },
  { label: "Поиск value-ставок", icon: "🎯" },
  { label: "Фильтрация сигналов", icon: "⚡" },
];

const STAGES_EN = [
  { label: "Scanning lines", icon: "📡" },
  { label: "Odds analysis", icon: "📊" },
  { label: "Probability calc", icon: "🧮" },
  { label: "Value detection", icon: "🎯" },
  { label: "Signal filtering", icon: "⚡" },
];

// Метрики, которые "считаются" в реальном времени
type Metric = { label: string; value: string; trend: "up" | "down" | "stable" };

const METRICS_RU: Metric[] = [
  { label: "Линий", value: "матчей", trend: "up" },
  { label: "Value", value: "сигналов", trend: "up" },
  { label: "Точность", value: "%", trend: "stable" },
  { label: "ROI", value: "%", trend: "up" },
];

export function LiveScanner({ language = "ru" }: LiveScannerProps) {
  const stages = language === "en" ? STAGES_EN : STAGES_RU;
  const [stageIndex, setStageIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(1247);
  const [valueCount, setValueCount] = useState(8);
  const [accuracy, setAccuracy] = useState(73.2);
  const [roi, setRoi] = useState(12.4);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Этапы меняются каждые 2.5 сек
    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 2500);

    // Метрики "живут" — дрейфуют реалистично
    const metricInterval = setInterval(() => {
      setMatchCount((prev) => {
        const delta = Math.floor(Math.random() * 18) - 4;
        return Math.max(1100, Math.min(2900, prev + delta));
      });
      setValueCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(3, Math.min(24, prev + delta));
      });
      setAccuracy((prev) => {
        const delta = (Math.random() - 0.45) * 1.4;
        return Math.max(58, Math.min(89, prev + delta));
      });
      setRoi((prev) => {
        const delta = (Math.random() - 0.4) * 0.8;
        return Math.max(-5, Math.min(28, prev + delta));
      });
    }, 1800);

    // Прогресс бегёт от 0 до 100 и сбрасывается
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 80);

    return () => {
      clearInterval(stageInterval);
      clearInterval(metricInterval);
      clearInterval(progressInterval);
    };
  }, [stages.length]);

  const isRu = language === "ru";
  const currentStage = stages[stageIndex];
  const accuracyStr = accuracy.toFixed(1);
  const roiStr = roi > 0 ? `+${roi.toFixed(1)}` : roi.toFixed(1);
  const roiColor = roi >= 0 ? "#34d399" : "#f87171";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pb-live-scanner-v3"
    >
      {/* Шапка сканера */}
      <div className="pb-ls-header-v3">
        <div className="pb-ls-live-dot-v3" />
        <span className="pb-ls-title-v3">{isRu ? "AI СКАНЕР · LIVE" : "AI SCANNER · LIVE"}</span>
      </div>

      {/* Эквалайзер — анимированные полоски */}
      <div className="pb-ls-eq-v3">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            className="pb-ls-eq-bar-v3"
            animate={{
              height: [
                `${20 + Math.random() * 20}%`,
                `${40 + Math.random() * 50}%`,
                `${15 + Math.random() * 30}%`,
              ],
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.03,
            }}
            style={{
              animationDelay: `${i * 0.04}s`,
              background: i % 3 === 0
                ? "linear-gradient(180deg, #22d3ee, transparent)"
                : i % 3 === 1
                ? "linear-gradient(180deg, #a78bfa, transparent)"
                : "linear-gradient(180deg, #fbbf24, transparent)",
            }}
          />
        ))}
      </div>

      {/* Текущий этап анализа */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stageIndex}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.3 }}
          className="pb-ls-stage-v3"
        >
          <span className="pb-ls-stage-icon-v3">{currentStage.icon}</span>
          <span className="pb-ls-stage-label-v3">{currentStage.label}</span>
        </motion.div>
      </AnimatePresence>

      {/* Прогресс-бар */}
      <div className="pb-ls-progress-track-v3">
        <motion.div
          className="pb-ls-progress-fill-v3"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Метрики — живые цифры */}
      <div className="pb-ls-metrics-v3">
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3">{matchCount.toLocaleString(isRu ? "ru-RU" : "en-US")}</span>
          <span className="pb-ls-metric-label-v3">{isRu ? "линий" : "lines"}</span>
        </div>
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3" style={{ color: "#34d399" }}>{valueCount}</span>
          <span className="pb-ls-metric-label-v3">{isRu ? "value" : "value"}</span>
        </div>
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3">{accuracyStr}%</span>
          <span className="pb-ls-metric-label-v3">{isRu ? "точность" : "accuracy"}</span>
        </div>
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3" style={{ color: roiColor }}>{roiStr}%</span>
          <span className="pb-ls-metric-label-v3">ROI</span>
        </div>
      </div>
    </motion.div>
  );
}
