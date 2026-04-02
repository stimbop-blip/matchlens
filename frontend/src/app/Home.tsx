import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Sparkles, TrendingUp } from "lucide-react";
import { Suspense, useMemo } from "react";

import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { FloatingHeroObject } from "../components/three/FloatingHeroObject";
import { SignalCard3D } from "../components/three/SignalCard3D";
import { SubscriptionProgress3D } from "../components/three/SubscriptionProgress3D";
import { useHaptics } from "../hooks/useHaptics";
import { api, type Signal } from "../lib/api";
import { useI18n } from "../lib/i18n";


const fallbackSignals: Signal[] = [
  {
    id: "s-1",
    sport: "football",
    league: "UEFA Champions League",
    teams: "Real Madrid vs Inter",
    market: "Total Over 2.5",
    pick: "Over 2.5",
    odds: 1.88,
    confidence: 82,
    roi: 19,
    startsAt: new Date().toISOString(),
    status: "new",
  },
  {
    id: "s-2",
    sport: "tennis",
    league: "ATP 500",
    teams: "Sinner vs Rublev",
    market: "Match Winner",
    pick: "Sinner",
    odds: 1.72,
    confidence: 78,
    roi: 14,
    startsAt: new Date().toISOString(),
    status: "new",
  },
];

export function Home() {
  const h = useHaptics();
  const { t } = useI18n();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const signalsQuery = useQuery({ queryKey: ["signals", "home-latest"], queryFn: () => api.getSignals({ status: "new" }) });

  const signals = useMemo(() => (signalsQuery.data?.length ? signalsQuery.data : fallbackSignals).slice(0, 3), [signalsQuery.data]);
  const progress = profileQuery.data?.subscription.progressPercent ?? 64;
  const titleName = profileQuery.data?.firstName || profileQuery.data?.username || "PIT BET Pro";

  return (
    <div className="space-y-3 pb-2">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass neon relative overflow-hidden p-4">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">PIT BET</p>
            <h1 className="mt-1 text-[22px] font-semibold leading-tight text-[var(--text-primary)]">{t("home.welcome")}, {titleName}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("home.subtitle")}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"><Sparkles size={12} />{t("home.liveModel")}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"><TrendingUp size={12} />{t("home.roiBoosted")}</span>
            </div>
          </div>
          <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)]">
            <Canvas camera={{ position: [0, 0, 3], fov: 38 }} dpr={[1, 1.2]} gl={{ antialias: false, powerPreference: "low-power" }}>
              <ambientLight intensity={0.75} />
              <pointLight position={[2, 2, 3]} intensity={1.35} color="#00ff9d" />
              <pointLight position={[-2, -1, 2]} intensity={1.0} color="#00b8ff" />
              <ErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <FloatingHeroObject type="trophy" scale={0.95} />
                </Suspense>
              </ErrorBoundary>
            </Canvas>
          </div>
        </div>
      </motion.section>

      <ErrorBoundary fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loading3d")}</section>}>
        <Suspense fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loading3d")}</section>}>
          <SubscriptionProgress3D percent={progress} label="Subscription status" caption={t("profile.premiumActive")} height={210} />
        </Suspense>
      </ErrorBoundary>

      <section className="glass p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("home.latestSignals")}</p>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{t("home.highConfidence")}</h2>
          </div>
          <button type="button" onClick={() => { h.soft(); signalsQuery.refetch(); }} className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]"><Bell size={14} />{t("common.refresh")}</button>
        </div>
        <div className="space-y-2.5">
          {signals.map((signal) => (
            <ErrorBoundary key={signal.id} fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loadingSignal")}</section>}>
              <Suspense fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loadingSignal")}</section>}>
                <SignalCard3D signal={signal} force3D onOpen={() => h.soft()} />
              </Suspense>
            </ErrorBoundary>
          ))}
        </div>
      </section>
    </div>
  );
}
