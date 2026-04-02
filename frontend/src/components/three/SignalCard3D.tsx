import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";

type CardStatus = "pending" | "won" | "lost" | "refund";

type SportTone = "football" | "tennis" | "generic";

function resolveSportTone(sport: string): SportTone {
  const kind = resolveSportKind(sport);
  if (kind === "football") return "football";
  if (kind === "tennis" || kind === "table_tennis") return "tennis";
  return "generic";
}

function sportGlyph(tone: SportTone): string {
  if (tone === "football") {
    return "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Zm0 2.3 1.8 1.3-.7 2h-2.2l-.7-2L12 6.1Zm-4 2.4 2-.2 1 1.7-1 1.8-2-.2-.7-1.6.7-1.5Zm8 0 2 .2.7 1.5-.7 1.6-2 .2-1-1.8 1-1.7Zm-5.5 4.3h3l1.2 1.8-2.7 1.9-2.7-1.9 1.2-1.8Z";
  }
  if (tone === "tennis") {
    return "M12 3.9a8.1 8.1 0 0 0-7.3 4.5l2 .8A5.9 5.9 0 0 1 12 6.1a5.9 5.9 0 0 1 5.3 3.1l2-.8A8.1 8.1 0 0 0 12 3.9Zm-6.6 7.2A6.7 6.7 0 0 0 12 18.9a6.7 6.7 0 0 0 6.6-7.8l-2.2.3A4.5 4.5 0 0 1 12 16.7a4.5 4.5 0 0 1-4.4-5.3l-2.2-.3Z";
  }
  return "M12 3.5 14.2 8l4.9.7-3.5 3.4.8 4.8L12 14.6 7.6 17l.8-4.9L5 8.7 9.8 8 12 3.5Z";
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
  const tone = resolveSportTone(sport);

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
          <div className={`pb-signal3d-canvas pb-signal3d-emblem ${tone}`} aria-hidden="true">
            <span className="pb-signal3d-emblem-glow" />
            <svg viewBox="0 0 24 24">
              <path d={sportGlyph(tone)} />
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
