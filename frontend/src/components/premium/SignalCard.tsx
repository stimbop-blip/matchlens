import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";

type CardStatus = "pending" | "won" | "lost" | "refund";

function sportPath(kind: ReturnType<typeof resolveSportKind>): string {
  if (kind === "football") return "M12 4.3a7.7 7.7 0 1 0 7.7 7.7A7.7 7.7 0 0 0 12 4.3m0 2.1 2.1 1.4-.8 2.5H10.7l-.8-2.5zm-3 5.7H15l1 2.8-2.1 1.5h-3.8L8 14.9z";
  if (kind === "hockey") return "M5.1 17.8c0 1 1 1.8 2 1.8h7.6c1 0 2-.8 2-1.8v-.6H5.1zm1-2.3h11.8l.6-5.1a2.2 2.2 0 0 0-2.2-2.5H7.9a2.2 2.2 0 0 0-2.2 2.5z";
  if (kind === "tennis" || kind === "table_tennis") return "M12 4.2a7.8 7.8 0 0 0 0 15.6A7.8 7.8 0 0 0 12 4.2m-4.8 3.1a5 5 0 0 1 3 4.7 5 5 0 0 1-3 4.8 6.2 6.2 0 0 1 0-9.5m9.6 0a6.2 6.2 0 0 1 0 9.5 5 5 0 0 1-3-4.8 5 5 0 0 1 3-4.7";
  if (kind === "basketball") return "M12 4.1a7.9 7.9 0 1 0 7.9 7.9A7.9 7.9 0 0 0 12 4.1m0 1.9v12M6 12h12M7.7 7.7a9.5 9.5 0 0 1 8.6 8.6m0-8.6a9.5 9.5 0 0 0-8.6 8.6";
  if (kind === "volleyball") return "M12 4.1a7.9 7.9 0 1 0 7.9 7.9A7.9 7.9 0 0 0 12 4.1m-5.6 4.7h5l2.4 3.3-1.8 4.8M9.9 5.2l2.3 3.6m5.6-1.4-4.4 1.4-1.9 5.1";
  if (kind === "esports") return "M5 7.5h14v8.6h-3.5L13 18.5h-2l-2.5-2.4H5zm2.2 2.1V14h9.6V9.6z";
  if (kind === "darts") return "m6.2 16.6 5-5 3.6 3.6 3.5-9.6-9.6 3.5 3.6 3.6-5 5z";
  if (kind === "mma") return "M6.1 12.2a5.9 5.9 0 1 1 11.8 0v.6H6.1Zm3.3 2.8h5.2v2.1H9.4Z";
  if (kind === "baseball") return "M12 4.1a7.9 7.9 0 1 0 7.9 7.9A7.9 7.9 0 0 0 12 4.1m-2 2.8c-.8 1.7-1.4 3.5-1.6 5.3M14 6.9c.8 1.7 1.4 3.5 1.6 5.3M10 17.1c-.8-1.7-1.4-3.5-1.6-5.3M14 17.1c.8-1.7 1.4-3.5 1.6-5.3";
  return "M12 4.2a7.8 7.8 0 1 0 7.8 7.8A7.8 7.8 0 0 0 12 4.2m0 3.3 1.4 2.8 3.1.5-2.3 2.2.5 3.2-2.7-1.5-2.7 1.5.5-3.2-2.3-2.2 3.1-.5z";
}

function SportMark({ sport, language }: { sport: string; language: SportLanguage }) {
  const kind = resolveSportKind(sport);
  return (
    <span className={`pb-signal-sport ${kind}`} aria-label={resolveSportLabel(sport, language)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={sportPath(kind)} />
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
