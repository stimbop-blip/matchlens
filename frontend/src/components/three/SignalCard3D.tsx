import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";

type CardStatus = "pending" | "won" | "lost" | "refund";
type SportVisualKind = "football" | "hockey" | "basketball" | "tennis" | "table_tennis" | "generic";

function resolveSportVisualKind(sport: string): SportVisualKind {
  const kind = resolveSportKind(sport);
  if (kind === "football" || kind === "hockey" || kind === "basketball" || kind === "tennis" || kind === "table_tennis") {
    return kind;
  }
  return "generic";
}

function sportVisualClass(kind: SportVisualKind): string {
  return kind === "table_tennis" ? "table-tennis" : kind;
}

function sportGlyph(kind: SportVisualKind): string {
  if (kind === "football") {
    return "M12 4.3a7.7 7.7 0 1 0 7.7 7.7A7.7 7.7 0 0 0 12 4.3m0 2.1 2.1 1.4-.8 2.5H10.7l-.8-2.5zm-3 5.7H15l1 2.8-2.1 1.5h-3.8L8 14.9z";
  }
  if (kind === "hockey") {
    return "M5.1 17.8c0 1 1 1.8 2 1.8h7.6c1 0 2-.8 2-1.8v-.6H5.1zm1-2.3h11.8l.6-5.1a2.2 2.2 0 0 0-2.2-2.5H7.9a2.2 2.2 0 0 0-2.2 2.5z";
  }
  if (kind === "basketball") {
    return "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Zm-.9 1.9h1.8v12.6h-1.8V5.7ZM5.8 11.1h12.4v1.8H5.8v-1.8Zm2.1-3.6a6.7 6.7 0 0 1 4.1 3.6 6.7 6.7 0 0 1-4.1 3.6A6.3 6.3 0 0 1 6.3 11c0-1.3.4-2.5 1.6-3.5Zm8.2 0A6.3 6.3 0 0 1 17.7 11c0 1.3-.4 2.5-1.6 3.5a6.7 6.7 0 0 1-4.1-3.6 6.7 6.7 0 0 1 4.1-3.6Z";
  }
  if (kind === "table_tennis") {
    return "M8.6 4.6a4.1 4.1 0 1 0 2.7 7.2l1.1 1.1a2 2 0 1 0 1.4-1.4l-1.1-1.1A4.1 4.1 0 0 0 8.6 4.6Zm7.7 8.6a2 2 0 1 1-1.4 3.4 2 2 0 0 1 1.4-3.4Z";
  }
  if (kind === "tennis") {
    return "M12 4.2a7.8 7.8 0 0 0 0 15.6A7.8 7.8 0 0 0 12 4.2m-4.8 3.1a5 5 0 0 1 3 4.7 5 5 0 0 1-3 4.8 6.2 6.2 0 0 1 0-9.5m9.6 0a6.2 6.2 0 0 1 0 9.5 5 5 0 0 1-3-4.8 5 5 0 0 1 3-4.7";
  }
  return "M12 4.2a7.8 7.8 0 1 0 7.8 7.8A7.8 7.8 0 0 0 12 4.2m0 3.3 1.4 2.8 3.1.5-2.3 2.2.5 3.2-2.7-1.5-2.7 1.5.5-3.2-2.3-2.2 3.1-.5z";
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
  const visualKind = resolveSportVisualKind(sport);
  const visualClass = sportVisualClass(visualKind);

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
          <div className={`pb-signal3d-canvas pb-signal3d-sport-art ${visualClass}`} aria-hidden="true">
            <span className="pb-signal3d-sport-art-glow" />
            <span className="pb-signal3d-sport-art-sheen" />
            <svg viewBox="0 0 24 24">
              <path d={sportGlyph(visualKind)} />
            </svg>
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
