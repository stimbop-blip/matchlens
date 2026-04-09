import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { resolveSportLabel, type SportLanguage } from "../../app/sport";
import { resolvePredictionCover } from "../../app/sportArt";

type CardStatus = "pending" | "won" | "lost" | "refund";

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
  betScreenshot,
  resultScreenshot,
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
  betScreenshot?: string | null;
  resultScreenshot?: string | null;
}) {
  const oddsText = Number.isFinite(odds) ? odds.toFixed(2) : String(odds);
  const sportName = resolveSportLabel(sport, language);
  const cover = resolvePredictionCover({
    sport,
    betScreenshot,
    resultScreenshot,
    variant: "landscape",
    seed: `${to}:${title}:${league}`,
  });

  return (
    <motion.article whileHover={{ y: -3 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.16, ease: "easeOut" }}>
      <Link to={to} className="pb-feed-luxe-card">
        <div className="pb-feed-luxe-media" aria-hidden="true">
          <img className="pb-feed-luxe-image" src={cover.src} alt="" loading="lazy" />
          <span className={`pb-feed-luxe-pill status ${status}`}>{statusLabel}</span>
          <span className="pb-feed-luxe-pill access">{accessLabel}</span>
          <div className="pb-feed-luxe-media-row">
            <span>{sportName}</span>
            <span>{mode}</span>
          </div>
          {cover.fallback ? <span className="pb-feed-luxe-art-tag">PIT BET ART</span> : null}
        </div>

        <div className="pb-feed-luxe-body">
          <small className="pb-feed-luxe-league">{league}</small>
          <h3>{title}</h3>

          <div className="pb-feed-luxe-core">
            <div className="pb-feed-luxe-pick">
              <small>{signal}</small>
              <p>{note}</p>
            </div>
            <div className="pb-feed-luxe-odds">
              <small>{oddsLabel}</small>
              <strong>{oddsText}</strong>
            </div>
          </div>

          <div className="pb-feed-luxe-meta">
            <span>{risk}</span>
            <span>{kickoff}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
