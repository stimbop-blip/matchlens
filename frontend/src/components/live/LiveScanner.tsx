import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LiveScannerProps = {
  language?: "ru" | "en";
};

/**
 * Премиум AI-сканер для главной страницы.
 *
 * Реалистичная симуляция работы нейросети:
 * - Цифры растут плавно (не прыгают хаотично)
 * - Кэфы "найденных" ставок реалистичны (1.65–3.40)
 * - Этапы идут последовательно, как реальный анализ
 * - Прогресс привязан к этапам
 * - Эквалайзер + wave + живые метрики
 */

const STAGES_RU = [
  { label: "Подключение к букмекерским линиям", icon: "📡", progress: 18 },
  { label: "Сбор live-коэффициентов", icon: "📊", progress: 34 },
  { label: "Анализ движения линий", icon: "📈", progress: 52 },
  { label: "Расчёт вероятностей по xG-модели", icon: "🧮", progress: 68 },
  { label: "Поиск value-ставок", icon: "🎯", progress: 84 },
  { label: "Фильтрация и отбор сигналов", icon: "⚡", progress: 96 },
];

const STAGES_EN = [
  { label: "Connecting to bookmaker lines", icon: "📡", progress: 18 },
  { label: "Collecting live odds", icon: "📊", progress: 34 },
  { label: "Analyzing line movement", icon: "📈", progress: 52 },
  { label: "Calculating xG probabilities", icon: "🧮", progress: 68 },
  { label: "Detecting value bets", icon: "🎯", progress: 84 },
  { label: "Filtering and selecting signals", icon: "⚡", progress: 96 },
];

// Реалистичные "найденные" ставки (как настоящий сканер бы показал)
const FOUND_PICKS_RU = [
  { league: "АПЛ", match: "Арсенал — Челси", odds: 1.85, type: "ТБ 2.5" },
  { league: "Ла Лига", match: "Реал — Бетис", odds: 1.72, type: "П1" },
  { league: "Серия А", match: "Интер — Эмполи", odds: 1.65, type: "ИТБ 1.5" },
  { league: "Бундеслига", match: "Бавария — Аугсбург", odds: 2.10, type: "ТБ 3.5" },
  { league: "ЛЧ", match: "Ман Сити — Интер", odds: 2.45, type: "П1" },
  { league: "Ла Лига", match: "Барселона — Сельта", odds: 1.95, type: "ТБ 2.5" },
  { league: "АПЛ", match: "Ливерпуль — Брайтон", odds: 2.25, type: "ИТБ 1.5" },
  { league: "Серия А", match: "Милан — Лечче", odds: 2.30, type: "ТБ 2.5" },
];

const FOUND_PICKS_EN = [
  { league: "EPL", match: "Arsenal — Chelsea", odds: 1.85, type: "O 2.5" },
  { league: "La Liga", match: "Real — Betis", odds: 1.72, type: "W1" },
  { league: "Serie A", match: "Inter — Empoli", odds: 1.65, type: "TO 1.5" },
  { league: "Bundesliga", match: "Bayern — Augsburg", odds: 2.10, type: "O 3.5" },
  { league: "UCL", match: "Man City — Inter", odds: 2.45, type: "W1" },
  { league: "La Liga", match: "Barcelona — Celta", odds: 1.95, type: "O 2.5" },
  { league: "EPL", match: "Liverpool — Brighton", odds: 2.25, type: "TO 1.5" },
  { league: "Serie A", match: "Milan — Lecce", odds: 2.30, type: "O 2.5" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Плавная интерполяция к целевому значению (как реальный счётчик)
function smoothApproach(current: number, target: number, speed = 0.18): number {
  return current + (target - current) * speed;
}

export function LiveScanner({ language = "ru" }: LiveScannerProps) {
  const isRu = language === "en" ? false : true;
  const stages = isRu ? STAGES_RU : STAGES_EN;
  const picks = isRu ? FOUND_PICKS_RU : FOUND_PICKS_EN;

  const [stageIndex, setStageIndex] = useState(0);
  const [scannedLines, setScannedLines] = useState(0);
  const [foundValue, setFoundValue] = useState(0);
  const [accuracy, setAccuracy] = useState(71.4);
  const [roi, setRoi] = useState(14.2);
  const [currentPick, setCurrentPick] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>(Array(32).fill(30));

  // Таргеты для плавного приближения
  const targets = useRef({
    lines: 1400,
    value: 6,
    accuracy: 73.0,
    roi: 14.5,
  });

  // Главный цикл — этапы анализа (последовательные)
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % stages.length;
        // На каждом новом этапе — новые таргеты
        if (next === 0) {
          // Новый цикл — обнуляем
          targets.current = { lines: 1200 + Math.random() * 400, value: 4 + Math.random() * 6, accuracy: 70 + Math.random() * 8, roi: 10 + Math.random() * 10 };
        } else if (next === stages.length - 1) {
          // Финальный этап — лучшие результаты
          targets.current = { lines: 2400 + Math.random() * 500, value: 8 + Math.random() * 8, accuracy: 76 + Math.random() * 6, roi: 16 + Math.random() * 8 };
        }
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [stages.length]);

  // Плавная анимация счётчиков (60fps ощущение)
  useEffect(() => {
    const interval = setInterval(() => {
      setScannedLines((prev) => Math.round(smoothApproach(prev, targets.current.lines, 0.08)));
      setFoundValue((prev) => {
        const next = smoothApproach(prev, targets.current.value, 0.1);
        return Math.round(next * 10) / 10;
      });
      setAccuracy((prev) => Math.round(smoothApproach(prev, targets.current.accuracy, 0.06) * 10) / 10);
      setRoi((prev) => Math.round(smoothApproach(prev, targets.current.roi, 0.06) * 10) / 10);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Эквалайзер — новые высоты каждые 120мс (плавный wave)
  useEffect(() => {
    const interval = setInterval(() => {
      setBarHeights((prev) => {
        const next = [...prev];
        // Сдвигаем влево (wave effect)
        next.shift();
        // Новое значение справа — зависит от этапа (позже = выше активность)
        const intensity = 0.4 + (stageIndex / stages.length) * 0.6;
        const base = 20 + Math.random() * 40 * intensity;
        const peak = Math.random() < 0.15 ? 70 + Math.random() * 30 : base;
        next.push(clamp(peak, 15, 100));
        return next;
      });
    }, 110);
    return () => clearInterval(interval);
  }, [stageIndex, stages.length]);

  // "Найденные" ставки — сменяются на финальных этапах
  useEffect(() => {
    if (stageIndex >= 3) {
      const interval = setInterval(() => {
        setCurrentPick((prev) => (prev + 1) % picks.length);
      }, 1600);
      return () => clearInterval(interval);
    }
  }, [stageIndex, picks.length]);

  const stage = stages[stageIndex];
  const pick = picks[currentPick];
  const roiColor = roi >= 0 ? "#34d399" : "#f87171";
  const roiStr = roi >= 0 ? `+${roi.toFixed(1)}` : roi.toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="pb-live-scanner-v3"
    >
      {/* Декоративное свечение */}
      <div className="pb-ls-glow-v3" aria-hidden="true" />

      {/* Шапка */}
      <div className="pb-ls-header-v3">
        <div className="pb-ls-live-badge-v3">
          <span className="pb-ls-live-dot-v3" />
          <span>LIVE</span>
        </div>
        <span className="pb-ls-title-v3">{isRu ? "НЕЙРОСЕТЬ АНАЛИЗИРУЕТ" : "AI ANALYZING"}</span>
        <span className="pb-ls-cycle-v3">#{stageIndex + 1}/{stages.length}</span>
      </div>

      {/* Эквалайзер — плавный wave */}
      <div className="pb-ls-eq-v3">
        {barHeights.map((h, i) => {
          const colorIdx = (i + stageIndex) % 3;
          return (
            <div
              key={i}
              className="pb-ls-eq-bar-v3"
              style={{
                height: `${h}%`,
                transition: "height 0.12s cubic-bezier(0.4, 0, 0.2, 1)",
                background: colorIdx === 0
                  ? "linear-gradient(180deg, #22d3ee 0%, rgba(34, 211, 238, 0.3) 100%)"
                  : colorIdx === 1
                  ? "linear-gradient(180deg, #a78bfa 0%, rgba(167, 139, 250, 0.3) 100%)"
                  : "linear-gradient(180deg, #fbbf24 0%, rgba(251, 191, 36, 0.3) 100%)",
                opacity: 0.4 + (h / 100) * 0.6,
              }}
            />
          );
        })}
      </div>

      {/* Текущий этап */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stageIndex}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="pb-ls-stage-v3"
        >
          <span className="pb-ls-stage-icon-v3">{stage.icon}</span>
          <span className="pb-ls-stage-label-v3">{stage.label}</span>
        </motion.div>
      </AnimatePresence>

      {/* Прогресс-бар привязан к этапу */}
      <div className="pb-ls-progress-track-v3">
        <motion.div
          className="pb-ls-progress-fill-v3"
          animate={{ width: `${stage.progress}%` }}
          transition={{ duration: 2.6, ease: "easeInOut" }}
        />
      </div>

      {/* "Найденная" ставка (на поздних этапах) */}
      <AnimatePresence>
        {stageIndex >= 3 ? (
          <motion.div
            key={currentPick}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="pb-ls-pick-v3"
          >
            <div className="pb-ls-pick-info-v3">
              <span className="pb-ls-pick-league-v3">{pick.league}</span>
              <span className="pb-ls-pick-match-v3">{pick.match}</span>
              <span className="pb-ls-pick-type-v3">{pick.type}</span>
            </div>
            <div className="pb-ls-pick-odds-v3">
              <span className="pb-ls-pick-odds-label-v3">{isRu ? "КЭФ" : "ODDS"}</span>
              <span className="pb-ls-pick-odds-value-v3">{pick.odds.toFixed(2)}</span>
            </div>
            <span className="pb-ls-pick-tag-v3">VALUE</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Метрики */}
      <div className="pb-ls-metrics-v3">
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3">{scannedLines.toLocaleString(isRu ? "ru-RU" : "en-US")}</span>
          <span className="pb-ls-metric-label-v3">{isRu ? "линий" : "lines"}</span>
        </div>
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3" style={{ color: "#34d399" }}>{foundValue.toFixed(0)}</span>
          <span className="pb-ls-metric-label-v3">{isRu ? "value" : "value"}</span>
        </div>
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3">{accuracy.toFixed(1)}%</span>
          <span className="pb-ls-metric-label-v3">{isRu ? "точность" : "hit rate"}</span>
        </div>
        <div className="pb-ls-metric-v3">
          <span className="pb-ls-metric-value-v3" style={{ color: roiColor }}>{roiStr}%</span>
          <span className="pb-ls-metric-label-v3">ROI</span>
        </div>
      </div>
    </motion.div>
  );
}
