import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";

type CardStatus = "pending" | "won" | "lost" | "refund";

function sportEmoji(sport: string): string {
  const kind = resolveSportKind(sport);
  if (kind === "football") return "⚽";
  if (kind === "hockey") return "🏒";
  if (kind === "basketball") return "🏀";
  if (kind === "tennis") return "🎾";
  if (kind === "table_tennis") return "🏓";
  if (kind === "volleyball") return "🏐";
  if (kind === "esports") return "🎮";
  if (kind === "darts") return "🎯";
  if (kind === "mma") return "🥊";
  if (kind === "baseball") return "⚾";
  return "🏅";
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
  const sportIcon = sportEmoji(sport);
  const sportName = resolveSportLabel(sport, language);

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

        <h3>{title}</h3>

        <div className="pb-signal3d-core">
          <div className="pb-signal3d-canvas pb-signal3d-sport-art" aria-hidden="true">
            <span className="pb-signal3d-sport-emoji" role="img" aria-label={sportName}>
              {sportIcon}
            </span>
          </div>

          <div className="pb-signal-v2-odds">
            <small>{oddsLabel}</small>
            <strong>{oddsText}</strong>
          </div>
        </div>

        <div className="pb-signal-v2-meta">
          <span>{mode}</span>
          <span>{risk}</span>
          <span>{kickoff}</span>
        </div>

        <div className="pb-signal-v2-foot">
          <small>{signal}</small>
          <p>{note}</p>
        </div>
      </Link>
    </motion.article>
  );
}
