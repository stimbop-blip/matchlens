import { useQuery } from "@tanstack/react-query";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { Settings, Shield, TrendingUp } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { FloatingHeroObject } from "../components/three/FloatingHeroObject";
import { ROIChart3D } from "../components/three/ROIChart3D";
import { SubscriptionProgress3D } from "../components/three/SubscriptionProgress3D";
import { useHaptics } from "../hooks/useHaptics";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAppTheme } from "../lib/theme";

type ProfileTab = "statistics" | "referrals" | "settings";

const roiFallback = [4, 7, 9, 8, 11, 13, 15, 14, 18, 19, 17, 22];

export function Profile() {
  const h = useHaptics();
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<ProfileTab>("statistics");
  const { theme, toggleTheme } = useAppTheme();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const p = profileQuery.data;

  const roiValues = useMemo(() => roiFallback, []);

  return (
    <div className="space-y-3 pb-2">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass neon p-4">
        <div className="flex items-center gap-3">
          <div className="h-[84px] w-[84px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80">
            <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }} dpr={[1, 1.2]} gl={{ antialias: false, powerPreference: "low-power" }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[2, 2, 3]} intensity={1.2} color="#00ff9d" />
              <pointLight position={[-2, -1, 2]} intensity={1.0} color="#00b8ff" />
              <ErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <FloatingHeroObject type="trophy" scale={0.72} />
                </Suspense>
              </ErrorBoundary>
            </Canvas>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("profile.title")}</p>
            <h1 className="truncate text-[20px] font-semibold text-[var(--text-primary)]">{p?.firstName || p?.username || t("profile.member")}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]"><Shield size={13} />{p?.role === "admin" ? t("profile.adminAccess") : t("profile.premiumMember")}</p>
          </div>
        </div>
      </motion.section>

      <ErrorBoundary fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loading3d")}</section>}>
        <Suspense fallback={<section className="glass p-4 text-sm text-[var(--text-secondary)]">{t("common.loading3d")}</section>}>
          <SubscriptionProgress3D percent={p?.subscription?.progressPercent ?? 72} label={t("profile.accessLevel")} caption={t("profile.premiumActive")} height={195} />
        </Suspense>
      </ErrorBoundary>

      <section className="glass p-2">
        <div className="grid grid-cols-3 gap-2">
          {(["statistics", "referrals", "settings"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                h.tap();
                setTab(key);
              }}
              className={`rounded-xl border px-2 py-2 text-xs ${tab === key ? "border-[color:color-mix(in_srgb,var(--accent)_48%,transparent)] text-[var(--text-primary)]" : "border-[var(--border)] text-[var(--text-secondary)]"}`}
            >
              {key === "statistics" ? t("profile.statistics") : key === "referrals" ? t("profile.referrals") : t("profile.settings")}
            </button>
          ))}
        </div>
      </section>

      {tab === "statistics" ? (
        <section className="glass p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{t("profile.roiAnalytics")}</h2>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]"><TrendingUp size={13} />{t("profile.live")}</span>
          </div>
          <ErrorBoundary fallback={<div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">{t("common.loadingChart")}</div>}>
            <Suspense fallback={<div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">{t("common.loadingChart")}</div>}>
              <ROIChart3D values={roiValues} height={220} />
            </Suspense>
          </ErrorBoundary>
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => {
              h.soft();
              toggleTheme();
            }}
            className="glass flex w-full items-center justify-between p-3"
          >
            <span className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]"><Settings size={16} />{t("profile.themeMode")}</span>
            <span className="text-xs text-[var(--text-secondary)]">{theme === "dark" ? "Dark" : "Light"}</span>
          </button>

          <div className="glass p-3 text-sm text-[var(--text-primary)]">
            <p className="font-semibold">{lang === "ru" ? "Правила игры" : "Game rules"}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {lang === "ru"
                ? "Играйте ответственно: управляйте банкроллом, не превышайте лимиты и принимайте решения только в ясном состоянии."
                : "Play responsibly: manage bankroll, keep limits and place bets only in a clear state of mind."}
            </p>
          </div>

          <div className="glass p-3 text-sm text-[var(--text-primary)]">
            <p className="font-semibold">{lang === "ru" ? "Оплаты и возвраты" : "Payments and refunds"}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {lang === "ru"
                ? "Проверяйте реквизиты перед оплатой. Для спорных случаев используйте поддержку, история операций хранится в системе."
                : "Always verify payment details. For disputed cases use support, transaction history is stored in the system."}
            </p>
          </div>

          {p?.role === "admin" ? (
            <Link
              to="/admin"
              onClick={() => h.tap()}
              className="glass flex w-full items-center justify-between p-3"
            >
              <span className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]"><Shield size={16} />{t("nav.admin")}</span>
              <span className="text-xs text-[var(--text-secondary)]">{lang === "ru" ? "Открыть" : "Open"}</span>
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
