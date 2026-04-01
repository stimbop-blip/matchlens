import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";
import { FloatingHeroObject } from "./FloatingHeroObject";

type CardStatus = "pending" | "won" | "lost" | "refund";

function mapSportToObject(sport: string): "trophy" | "football" | "hockey" | "tennis" | "basketball" | "volleyball" | "baseball" | "mma" | "esports" | "darts" | "generic" {
  const kind = resolveSportKind(sport);
  if (kind === "football") return "football";
  if (kind === "tennis" || kind === "table_tennis") return "tennis";
  if (kind === "hockey") return "hockey";
  if (kind === "basketball") return "basketball";
  if (kind === "volleyball") return "volleyball";
  if (kind === "baseball") return "baseball";
  if (kind === "mma") return "mma";
  if (kind === "esports") return "esports";
  if (kind === "darts") return "darts";
  return "generic";
}

export function SignalCard3D({
  to,
  title,
  league,
  sport,
  mode,
  kickoff,
  signal,
  odds,
  oddsLabel,
  risk,
  status,
  statusLabel,
  accessLabel,
  note,
  language,
}: {
  to: string;
  title: string;
  league: string;
  sport: string;
  mode: string;
  kickoff: string;
  signal: string;
  odds: number;
  oddsLabel: string;
  risk: string;
  status: CardStatus;
  statusLabel: string;
  accessLabel: string;
  note: string;
  language: SportLanguage;
}) {
  const oddsText = Number.isFinite(odds) ? odds.toFixed(2) : String(odds);
  const modelType = mapSportToObject(sport);

  return (
    <motion.article whileHover={{ y: -4 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.16, ease: "easeOut" }}>
      <Link to={to} className="pb-signal3d-card">
        <div className="pb-signal3d-head">
          <div>
            <small>{resolveSportLabel(sport, language)}</small>
            <p>{league}</p>
          </div>
          <div className="pb-signal-v2-badges">
            <span className={`pb-signal-status ${status}`}>{statusLabel}</span>
            <span className="pb-signal-access">{accessLabel}</span>
          </div>
        </div>

        <h3 className="pb-signal3d-title">{title}</h3>

        <div className="pb-signal3d-core">
          <div className="pb-signal3d-canvas" aria-hidden="true">
            <Canvas camera={{ position: [0, 0, 3], fov: 42 }} dpr={[1, 1.3]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[2, 1.8, 3]} intensity={1.1} color="#2cd8b7" />
              <pointLight position={[-2, -1.2, 2.6]} intensity={0.8} color="#2f8cff" />
              <FloatingHeroObject type={modelType} scale={0.85} />
            </Canvas>
          </div>

          <div className="pb-signal-v2-odds">
            <small>{oddsLabel}</small>
            <strong>{oddsText}</strong>
          </div>
        </div>

        <div className="pb-signal-v2-meta pb-signal3d-meta">
          <span>{mode}</span>
          <span>{risk}</span>
          <span>{kickoff}</span>
        </div>

        <div className="pb-signal-v2-foot pb-signal3d-foot">
          <small>{signal}</small>
          <p>{note}</p>
        </div>
      </Link>
    </motion.article>
  );
}
