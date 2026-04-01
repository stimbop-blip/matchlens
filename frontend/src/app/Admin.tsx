import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Users, Wallet, Zap } from "lucide-react";
import { Suspense, lazy } from "react";

import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { ThreeFallbackBoundary } from "../components/three/ThreeFallbackBoundary";

const ROIChart3D = lazy(() => import("../components/three/ROIChart3D").then((m) => ({ default: m.ROIChart3D })));

export function Admin() {
  const { t } = useI18n();
  const overviewQuery = useQuery({ queryKey: ["admin-overview"], queryFn: api.adminOverview });

  const metrics = overviewQuery.data ?? {
    users: 1240,
    activeSubs: 398,
    mrr: 1249000,
    signalsToday: 27,
  };

  return (
    <div className="space-y-3 pb-2">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass neon p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("admin.eyebrow")}</p>
        <h1 className="text-[21px] font-semibold text-[var(--text-primary)]">{t("admin.title")}</h1>
      </motion.section>

      <section className="grid grid-cols-2 gap-2">
        <div className="glass p-3"><Users size={16} /><p className="text-2xl font-semibold">{metrics.users}</p></div>
        <div className="glass p-3"><Zap size={16} /><p className="text-2xl font-semibold">{metrics.activeSubs}</p></div>
        <div className="glass p-3"><Wallet size={16} /><p className="text-2xl font-semibold">{metrics.mrr} ₽</p></div>
        <div className="glass p-3"><Activity size={16} /><p className="text-2xl font-semibold">{metrics.signalsToday}</p></div>
      </section>

      <section className="glass p-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{t("admin.roiTrend")}</h2>
        <ThreeFallbackBoundary fallback={<div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">Chart unavailable</div>}>
          <Suspense fallback={<div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">{t("common.loadingChart")}</div>}>
            <ROIChart3D values={[6, 8, 10, 9, 12, 13, 15, 14, 17, 18, 21, 23]} height={220} />
          </Suspense>
        </ThreeFallbackBoundary>
      </section>
    </div>
  );
}
