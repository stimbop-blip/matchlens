import { useQuery } from "@tanstack/react-query";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { Settings, Shield, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { FloatingHeroObject } from "../components/three/FloatingHeroObject";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAppTheme } from "../lib/theme";
import { useHaptics } from "../hooks/useHaptics";

type ProfileTab = "statistics" | "referrals" | "settings";

const roiFallback = [4, 7, 9, 8, 11, 13, 15, 14, 18, 19, 17, 22];

export function Profile() {
  const h = useHaptics();
  const { t } = useI18n();
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
            <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }} dpr={[1, 1.8]}>
              <ambientLight intensity={0.8} />
              <pointLight position={[2, 2, 3]} intensity={1.2} color="#00ff9d" />
              <pointLight position={[-2, -1, 2]} intensity={1.0} color="#00b8ff" />
              <FloatingHeroObject type="trophy" scale={0.72} />
            </Canvas>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("profile.title")}</p>
            <h1 className="truncate text-[20px] font-semibold text-[var(--text-primary)]">{p?.firstName || p?.username || t("profile.member")}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]"><Shield size={13} />{p?.role === "admin" ? t("profile.adminAccess") : t("profile.premiumMember")}</p>
          </div>
        </div>
      </motion.section>

      <section className="glass p-4 text-sm text-[var(--text-secondary)]">3D subscription progress disabled</section>

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
          <div className="rounded-xl border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">3D ROI chart disabled</div>
        </section>
      ) : null}

      {tab === "settings" ? (
        <section>
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
        </section>
      ) : null}
    </div>
  );
}
