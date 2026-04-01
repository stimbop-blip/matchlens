import { motion } from "framer-motion";

import { resolveSportKind } from "../../app/sport";

export function HomeHeroScene3D() {
  return (
    <motion.div
      className="pb-home3d-canvas pb-home3d-scene pb-home3d-scene-hero"
      animate={{ rotateY: [0, 8, 0, -8, 0], translateY: [0, -2, 0, 2, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="orb one" />
      <span className="orb two" />
      <span className="orb three" />
      <span className="halo" />
    </motion.div>
  );
}

export function HomeSignalScene3D({ sport }: { sport: string }) {
  const kind = resolveSportKind(sport);
  const kindClass = kind === "football" ? "football" : kind === "tennis" || kind === "table_tennis" ? "tennis" : "generic";

  return (
    <motion.div
      className={`pb-home3d-canvas pb-home3d-scene pb-home3d-scene-sport ${kindClass}`}
      animate={{ rotateY: [0, 14, 0, -14, 0], translateY: [0, -2, 0, 2, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="core" />
      <span className="ring" />
      <span className="shadow" />
    </motion.div>
  );
}

export function HomeSubscriptionScene3D({ percent }: { percent: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <motion.div
      className="pb-home3d-canvas pb-home3d-scene pb-home3d-scene-ring"
      animate={{ rotateY: [0, 12, 0, -12, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="back" />
      <span className="meter" style={{ background: `conic-gradient(#2cd8b7 ${safe}%, rgba(255,255,255,0.12) ${safe}% 100%)` }} />
      <span className="center" />
    </motion.div>
  );
}
