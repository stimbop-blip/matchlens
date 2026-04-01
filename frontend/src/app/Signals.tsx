import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Filter, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { Suspense, lazy, useMemo, useState } from "react";

import { useHaptics } from "../hooks/useHaptics";
import { api, type Signal } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { ThreeFallbackBoundary } from "../components/three/ThreeFallbackBoundary";

const SignalCard3D = lazy(() => import("../components/three/SignalCard3D").then((m) => ({ default: m.SignalCard3D })));

type SportFilter = "all" | "football" | "tennis" | "basketball";
type StatusFilter = "all" | "new" | "live" | "won" | "lost";

const sports: SportFilter[] = ["all", "football", "tennis", "basketball"];
const statuses: StatusFilter[] = ["all", "new", "live", "won", "lost"];
const PULL_THRESHOLD = 88;
const MAX_PULL = 150;

function rubberBand(distance: number, dimension = 420, constant = 0.55) {
  if (distance <= 0) return 0;
  return (dimension * distance * constant) / (dimension + constant * distance);
}

export function Signals() {
  const { t } = useI18n();
  const h = useHaptics();

  const [sport, setSport] = useState<SportFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [readyToRefresh, setReadyToRefresh] = useState(false);

  const rawPull = useMotionValue(0);
  const pullY = useSpring(rawPull, { stiffness: 280, damping: 30, mass: 0.5 });

  const query = useQuery({
    queryKey: ["signals", sport, status],
    queryFn: () =>
      api.getSignals({
        sport: sport === "all" ? undefined : sport,
        status: status === "all" ? undefined : status,
      }),
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  const onDrag = (_: unknown, info: { offset: { y: number } }) => {
    if (window.scrollY > 0) return;
    const rb = rubberBand(Math.max(0, info.offset.y));
    const clamped = Math.min(MAX_PULL, rb);
    rawPull.set(clamped);
    const nextReady = clamped >= PULL_THRESHOLD;
    if (nextReady !== readyToRefresh) {
      setReadyToRefresh(nextReady);
      if (nextReady) h.medium();
    }
  };

  const onDragEnd = async () => {
    const current = rawPull.get();
    const shouldRefresh = current >= PULL_THRESHOLD && window.scrollY <= 2;

    if (shouldRefresh) {
      h.success();
      rawPull.set(56);
      await query.refetch();
    }
    setReadyToRefresh(false);
    rawPull.set(0);
  };

  return (
    <motion.div
      className="space-y-3 pb-2"
      drag="y"
      dragElastic={0.12}
      dragConstraints={{ top: 0, bottom: 220 }}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      style={{ y: pullY }}
    >
      <div className="pointer-events-none relative z-20 h-0">
        <AnimatePresence>
          {rawPull.get() > 4 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.94 }}
              animate={{ opacity: 1, y: -6, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.94 }}
              className="mx-auto w-fit rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-3 py-1.5 text-xs text-[var(--text-secondary)] backdrop-blur-xl"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw size={13} className={query.isFetching ? "animate-spin" : ""} />
                {readyToRefresh ? t("signals.releaseToRefresh") : t("signals.pullToRefresh")}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="glass p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("signals.eyebrow")}</p>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">{t("signals.title")}</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              h.soft();
              query.refetch();
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]"
          >
            <RefreshCcw size={14} />
            {t("common.refresh")}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Filter size={13} /> {t("signals.filterSport")}
          </div>
          <div className="flex flex-wrap gap-2">
            {sports.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  h.tap();
                  setSport(item);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  sport === item
                    ? "border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] text-[var(--text-primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {t(`sport.${item}`)}
              </button>
            ))}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <SlidersHorizontal size={13} /> {t("signals.filterStatus")}
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  h.tap();
                  setStatus(item);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  status === item
                    ? "border-[color:color-mix(in_srgb,var(--accent-secondary)_46%,transparent)] text-[var(--text-primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {t(`status.${item}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        {items.map((signal: Signal, idx: number) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: 0.05 + idx * 0.05 }}
          >
            <ThreeFallbackBoundary fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">Signal unavailable</section>}>
              <Suspense fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loadingSignal")}</section>}>
                <SignalCard3D signal={signal} onOpen={() => h.soft()} />
              </Suspense>
            </ThreeFallbackBoundary>
          </motion.div>
        ))}
      </section>
    </motion.div>
  );
}
