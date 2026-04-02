import { Canvas } from "@react-three/fiber";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";
import { Suspense, useState } from "react";

import { useHaptics } from "../../hooks/useHaptics";
import { type Signal } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { FloatingHeroObject } from "./FloatingHeroObject";

type Props = {
  signal: Signal;
  onOpen?: (signal: Signal) => void;
};

function toSportObject(sport: Signal["sport"]): "football" | "tennis" | "trophy" {
  if (sport === "football") return "football";
  if (sport === "tennis") return "tennis";
  return "trophy";
}

export function SignalCard3D({ signal, onOpen }: Props) {
  const { t } = useI18n();
  const h = useHaptics();

  const [flipped, setFlipped] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);
  const transform = useMotionTemplate`perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

  const handleMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateX.set((0.5 - py) * 10);
    rotateY.set((px - 0.5) * 12);
  };

  const handleLeave = () => {
    animate(rotateX, 0, { type: "spring", stiffness: 180, damping: 18 });
    animate(rotateY, 0, { type: "spring", stiffness: 180, damping: 18 });
    animate(scale, 1, { type: "spring", stiffness: 200, damping: 18 });
  };

  return (
    <motion.button
      type="button"
      className="group relative w-full overflow-hidden rounded-[22px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_84%,transparent)] text-left backdrop-blur-xl"
      style={{ transformStyle: "preserve-3d", transform }}
      onPointerMove={handleMove}
      onPointerEnter={() => animate(scale, 1.015, { type: "spring", stiffness: 220, damping: 16 })}
      onPointerLeave={handleLeave}
      onClick={() => {
        h.tap();
        h.soft();
        setFlipped((v) => !v);
        onOpen?.(signal);
      }}
    >
      <div className="grid min-h-[190px] grid-cols-[1fr_112px] gap-2 p-4">
        <motion.div
          className="relative flex flex-col"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div style={{ backfaceVisibility: "hidden" }}>
            <p className="text-[11px] text-[var(--text-secondary)]">{signal.league}</p>
            <h3 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">{signal.teams}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 px-2 py-1.5">
                <p className="text-[var(--text-secondary)]">{t("signal.market")}</p>
                <p className="font-medium text-[var(--text-primary)]">{signal.market}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 px-2 py-1.5">
                <p className="text-[var(--text-secondary)]">{t("signal.pick")}</p>
                <p className="font-medium text-[var(--text-primary)]">{signal.pick}</p>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-center" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
            <p className="text-[12px] text-[var(--text-secondary)]">ROI / {t("signal.confidence")}</p>
            <p className="mt-1 text-[22px] font-semibold text-[var(--text-primary)]">{signal.roi ?? 0}%</p>
            <p className="text-[13px] text-[var(--text-secondary)]">{t("signal.confidence")}: {signal.confidence}%</p>
          </div>
        </motion.div>

        <div className="h-[110px] w-[110px] self-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
          <Canvas camera={{ position: [0, 0, 3.2], fov: 42 }} dpr={[1, 1.8]}>
            <ambientLight intensity={0.6} />
            <pointLight position={[2, 2, 3]} intensity={1.2} color="#00ff9d" />
            <pointLight position={[-2, -1, 2]} intensity={0.8} color="#00b8ff" />
            <Suspense fallback={null}>
              <FloatingHeroObject type={toSportObject(signal.sport)} scale={0.85} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-[12px]">
        <span className="text-[var(--text-secondary)]">{t("signal.odds")} {signal.odds.toFixed(2)}</span>
        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[var(--text-primary)]">{t("signal.tapToFlip")}</span>
      </div>
    </motion.button>
  );
}
