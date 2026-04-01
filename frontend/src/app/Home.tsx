import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Crown, Sparkles, TrendingUp } from "lucide-react";
import { Suspense, lazy, useMemo } from "react";

import { useHaptics } from "../hooks/useHaptics";
import { api, type Signal } from "../lib/api";
import { useI18n } from "../lib/i18n";

const FloatingHeroObject = lazy(() => import("../components/three/FloatingHeroObject").then((m) => ({ default: m.FloatingHeroObject })));
const SignalCard3D = lazy(() => import("../components/three/SignalCard3D").then((m) => ({ default: m.SignalCard3D })));
const SubscriptionProgress3D = lazy(() => import("../components/three/SubscriptionProgress3D").then((m) => ({ default: m.SubscriptionProgress3D })));


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
  const titleName = profileQuery.data?.firstName || profileQuery.data?.username || "Member";

  return (
    <div className="space-y-3 pb-2">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass neon relative overflow-hidden p-4"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 54%), radial-gradient(circle at 15% 90%, color-mix(in srgb, var(--accent-secondary) 16%, transparent), transparent 58%)",
          }}
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">PIT BET</p>
            <h1 className="mt-1 text-[24px] font-semibold leading-tight text-[var(--text-primary)]">Welcome back, {titleName}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("home.subtitle")}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"><Sparkles size={12} />{t("home.liveModel")}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"><TrendingUp size={12} />{t("home.roiBoosted")}</span>
            </div>
          </div>
          <div className="h-[128px] w-[128px] shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)]">
            <Canvas
              camera={{ position: [0, 0, 3], fov: 38 }}
              dpr={[1, 1.8]}
              gl={{ alpha: true, antialias: true }}
              onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            >
              <ambientLight intensity={0.75} />
              <pointLight position={[2, 2, 3]} intensity={1.35} color="#00ff9d" />
              <pointLight position={[-2, -1, 2]} intensity={1.0} color="#00b8ff" />
              <Suspense fallback={null}>
                <FloatingHeroObject type="trophy" scale={0.95} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <Suspense fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loading3d")}</section>}>
          <SubscriptionProgress3D percent={progress} label="Premium subscription" caption={t("profile.premiumActive")} height={220} />
        </Suspense>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("home.latestSignals")}</p>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{t("home.highConfidence")}</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              h.soft();
              signalsQuery.refetch();
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]"
          >
            <Bell size={14} />
            {t("common.refresh")}
          </button>
        </div>

        <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_78%,transparent)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
          <Crown size={12} />
          Premium feed
        </div>

        <div className="space-y-2.5">
          {signals.slice(0, 3).map((signal) => (
            <Suspense key={signal.id} fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loadingSignal")}</section>}>
              <SignalCard3D signal={signal} onOpen={() => h.soft()} />
            </Suspense>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
