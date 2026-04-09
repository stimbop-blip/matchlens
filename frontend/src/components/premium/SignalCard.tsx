import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { resolveSportKind, resolveSportLabel, type SportLanguage } from "../../app/sport";

type CardStatus = "pending" | "won" | "lost" | "refund";

const FOOTBALL_HERO_IMAGE = "/images/sports/football-dark.png";

function cleanImage(value: string | null | undefined): string | null {
  const trimmed = (value || "").trim();
  return trimmed ? trimmed : null;
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
  betScreenshot,
  resultScreenshot,
  highConfidence = false,
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
  highConfidence?: boolean;
}) {
  const oddsText = Number.isFinite(odds) ? odds.toFixed(2) : String(odds);
  const sportName = resolveSportLabel(sport, language);
  const isFootball = resolveSportKind(sport) === "football";
  const coverSrc = isFootball
    ? FOOTBALL_HERO_IMAGE
    : cleanImage(betScreenshot) || cleanImage(resultScreenshot) || FOOTBALL_HERO_IMAGE;

  return (
    <motion.article whileHover={{ y: -3 }} whileTap={{ scale: 0.995 }} transition={{ duration: 0.16, ease: "easeOut" }}>
      <Link to={to} className={highConfidence ? "pb-feed-luxe-card pb-feed-luxe-card-neon" : "pb-feed-luxe-card"}>
        <div className={isFootball ? "pb-feed-luxe-media football" : "pb-feed-luxe-media"} aria-hidden="true">
          <img className="pb-feed-luxe-image" src={coverSrc} alt="" loading="lazy" />
          <span className={`pb-feed-luxe-pill status ${status}`}>{statusLabel}</span>
          <span className="pb-feed-luxe-pill access">{accessLabel}</span>
          <div className="pb-feed-luxe-media-row">
            <span>{sportName}</span>
            <span>{mode}</span>
          </div>
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
