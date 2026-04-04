import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";
import { sportIconPath } from "../../app/sportArt";

type CardStatus = "pending" | "won" | "lost" | "refund";

function SportMark({ sport, language }: { sport: string; language: SportLanguage }) {
  const kind = resolveSportKind(sport);
  return (
    <span className={`pb-signal-sport ${kind}`} aria-label={resolveSportLabel(sport, language)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={sportIconPath(kind)} />
      </svg>
    </span>
  );
}

export function SignalCard({
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

  return (
    <motion.article whileHover={{ y: -3 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.16, ease: "easeOut" }}>
      <Link to={to} className="pb-signal-card-v2">
        <header className="pb-signal-v2-head">
          <div className="pb-signal-v2-sportline">
            <SportMark sport={sport} language={language} />
            <div>
              <small>{resolveSportLabel(sport, language)}</small>
              <p>{league}</p>
            </div>
          </div>
          <div className="pb-signal-v2-badges">
            <span className={`pb-signal-status ${status}`}>{statusLabel}</span>
            <span className="pb-signal-access">{accessLabel}</span>
          </div>
        </header>

        <h3>{title}</h3>

        <div className="pb-signal-v2-core">
          <div className="pb-signal-v2-odds">
            <small>{oddsLabel}</small>
            <strong>{oddsText}</strong>
          </div>
          <div className="pb-signal-v2-meta">
            <span>{mode}</span>
            <span>{risk}</span>
            <span>{kickoff}</span>
          </div>
        </div>

        <div className="pb-signal-v2-foot">
          <small>{signal}</small>
          <p>{note}</p>
        </div>
      </Link>
    </motion.article>
  );
}
