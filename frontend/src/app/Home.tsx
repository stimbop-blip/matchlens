import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "./i18n";
import { resolveSportLabel } from "./sport";
import { resolveSubscriptionSnapshot } from "./subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { PageTransition } from "../components/motion/PageTransition";
import { RocketLoader } from "../components/ui";
import { api, type NewsPost, type Prediction, type PublicStats } from "../services/api";

function formatDate(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function predictionRecency(prediction: Prediction): number {
  const publishedMs = prediction.published_at ? new Date(prediction.published_at).getTime() : 0;
  const eventMs = new Date(prediction.event_start_at).getTime();
  const safePublishedMs = Number.isNaN(publishedMs) ? 0 : publishedMs;
  const safeEventMs = Number.isNaN(eventMs) ? 0 : eventMs;
  return Math.max(safePublishedMs, safeEventMs);
}

function newsRecency(item: NewsPost): number {
  const publishedMs = item.published_at ? new Date(item.published_at).getTime() : 0;
  return Number.isNaN(publishedMs) ? 0 : publishedMs;
}

function formatNewsDate(value: string | null, language: "ru" | "en", fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: Prediction["status"], t: (key: string) => string): string {
  if (status === "won") return t("feed.status.won");
  if (status === "lost") return t("feed.status.lost");
  if (status === "refund") return t("feed.status.refund");
  return t("feed.status.pending");
}

function riskLabel(level: string, t: (key: string) => string): string {
  if (level === "low") return t("common.risk.low");
  if (level === "high") return t("common.risk.high");
  return t("common.risk.medium");
}

function accessLabel(level: Prediction["access_level"], t: (key: string) => string): string {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function sportEmoji(value: string): string {
  const sport = value.toLowerCase();
  if (sport.includes("football") || sport.includes("soccer")) return "⚽";
  if (sport.includes("hockey")) return "🏒";
  if (sport.includes("basketball")) return "🏀";
  if (sport.includes("tennis") && sport.includes("table")) return "🏓";
  if (sport.includes("tennis")) return "🎾";
  if (sport.includes("volley")) return "🏐";
  return "🏅";
}

function teaser(value: string | null | undefined, fallback: string): string {
  const compact = (value || "").replace(/\s+/g, " ").trim();
  if (!compact) return fallback;
  if (compact.length <= 140) return compact;
  return `${compact.slice(0, 137).trim()}...`;
}

function previewNews(value: string, maxLength = 160): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function Home() {
  const { t, language } = useI18n();

  const [displayName, setDisplayName] = useState("PIT BET");
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [signals, setSignals] = useState<Prediction[]>([]);
  const [signalSource, setSignalSource] = useState<"pending" | "won">("pending");
  const [newsItems, setNewsItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);

      try {
        const [meRes, subRes, statsRes, pendingRes, newsRes] = await Promise.allSettled([
          api.me(),
          api.mySubscription(),
          api.stats(),
          api.predictions({ status: "pending", limit: 24 }),
          api.news(),
        ]);
        if (!alive) return;

        if (meRes.status === "fulfilled") {
          setDisplayName(meRes.value.first_name || meRes.value.username || "PIT BET");
        }

        setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
        setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
        setNewsItems(newsRes.status === "fulfilled" ? newsRes.value : []);

        const pending = pendingRes.status === "fulfilled" ? pendingRes.value : [];

        if (pending.length > 0) {
          setSignalSource("pending");
          setSignals([...pending].sort((a, b) => predictionRecency(b) - predictionRecency(a)).slice(0, 2));
          return;
        }

        try {
          const won = await api.predictions({ status: "won", limit: 24 });
          if (!alive) return;
          setSignalSource("won");
          setSignals([...won].sort((a, b) => predictionRecency(b) - predictionRecency(a)).slice(0, 2));
        } catch {
          if (!alive) return;
          setSignalSource("pending");
          setSignals([]);
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subscriptionRaw);
  const activeSignals = useMemo(() => signals.slice(0, 2), [signals]);
  const latestNews = useMemo(
    () => [...newsItems].filter((item) => item.is_published).sort((a, b) => newsRecency(b) - newsRecency(a)).slice(0, 2),
    [newsItems],
  );
  const signalModeSubtitle =
    signalSource === "pending"
      ? language === "ru"
        ? "2 последних матча в ожидании"
        : "2 latest pending matches"
      : language === "ru"
        ? "Ожидающих нет - показаны 2 последних выигранных"
        : "No pending matches - showing 2 latest won";

  const subtitleText = language === "ru" ? "Рабочий центр прогнозов внутри Telegram" : "Working forecast hub inside Telegram";

  return (
    <PageTransition>
      <Layout>
        <section className="pb-premium-panel pb-telegram-hero pb-reveal">
          <div className="pb-telegram-hero-top">
            <span className={`pb-tier-pill ${sub.tariff}`}>{accessLabel(sub.tariff, t)}</span>
            <span className="pb-telegram-status-chip">{sub.is_active ? t("common.status.active") : t("common.status.expired")}</span>
          </div>

          <h3>{`${language === "ru" ? "Добро пожаловать" : "Welcome"}, ${displayName}`}</h3>
          <p>{subtitleText}</p>

          <div className="pb-telegram-hero-metrics">
            <article>
              <small>{language === "ru" ? "Сигналы" : "Signals"}</small>
              <strong>{stats?.total_predictions ?? signals.length}</strong>
            </article>
            <article>
              <small>{language === "ru" ? "В ожидании" : "Pending"}</small>
              <strong>{stats?.pending ?? signals.length}</strong>
            </article>
            <article>
              <small>{language === "ru" ? "Точность" : "Hit rate"}</small>
              <strong>{`${(stats?.hit_rate ?? 0).toFixed(1)}%`}</strong>
            </article>
          </div>

          <div className="pb-overview-hero-actions pb-telegram-hero-actions">
            <Link className="pb-btn pb-btn-primary" to="/feed">
              {t("home.hero.ctaSignals")}
            </Link>
            <Link className="pb-btn pb-btn-secondary" to="/tariffs">
              {t("layout.main.openTariffs")}
            </Link>
          </div>
        </section>

        <section className="pb-premium-panel pb-telegram-predictions pb-reveal">
          <div className="pb-premium-head">
            <h3>{language === "ru" ? "Последние прогнозы" : "Latest forecasts"}</h3>
            <small>{signalModeSubtitle}</small>
          </div>

          {loading ? <RocketLoader title={t("home.loadingTitle")} subtitle={t("home.loadingSubtitle")} compact /> : null}

          {!loading && activeSignals.length > 0 ? (
            <div className="pb-telegram-predictions-list">
              {activeSignals.map((signal) => (
                <Link key={signal.id} to={`/feed/${signal.id}`} className="pb-telegram-prediction-card">
                  <div className="pb-telegram-prediction-icon" aria-hidden="true">
                    {sportEmoji(signal.sport_type)}
                  </div>
                  <div className="pb-telegram-prediction-main">
                    <strong>{signal.match_name}</strong>
                    <p>{signal.league || t("feed.noLeague")}</p>
                    <div className="pb-telegram-prediction-meta">
                      <span className={`pb-telegram-status ${signal.status}`}>{statusLabel(signal.status, t)}</span>
                      <span>{signal.mode === "live" ? t("common.live") : t("common.prematch")}</span>
                      <span>{resolveSportLabel(signal.sport_type, language)}</span>
                    </div>
                    <small>{teaser(signal.short_description, t("feed.teaserFallback"))}</small>
                  </div>
                  <div className="pb-telegram-prediction-odds">
                    <small>{t("feed.label.odds")}</small>
                    <strong>{Number.isFinite(signal.odds) ? signal.odds.toFixed(2) : String(signal.odds)}</strong>
                    <span>{riskLabel(signal.risk_level, t)}</span>
                    <span>{formatDate(signal.event_start_at, language)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {!loading && activeSignals.length === 0 ? <p className="pb-empty-state">{t("home.today.empty")}</p> : null}
        </section>

        <section className="pb-premium-panel pb-home-news-showcase pb-reveal">
          <div className="pb-premium-head">
            <h3>{t("home.news.title")}</h3>
            <small>{language === "ru" ? "Две последние публикации" : "Two latest publications"}</small>
          </div>

          {latestNews.length > 0 ? (
            <>
              <div className="pb-home-news-grid">
                {latestNews.map((item, index) => (
                  <Link key={item.id} className={index === 0 ? "pb-home-news-card lead" : "pb-home-news-card"} to={`/news/${item.id}`}>
                    <span className="pb-home-news-chip">{item.category || t("layout.title.news")}</span>
                    <h4>{item.title}</h4>
                    <p>{previewNews(item.body)}</p>
                    <small>{formatNewsDate(item.published_at, language, t("common.noDate"))}</small>
                  </Link>
                ))}
              </div>

              <div className="pb-home-news-actions">
                <Link className="pb-btn pb-btn-secondary" to="/news">
                  {t("home.news.openAll")}
                </Link>
              </div>
            </>
          ) : (
            <p className="pb-empty-state">{t("home.news.empty")}</p>
          )}
        </section>

        <AppDisclaimer />
      </Layout>
    </PageTransition>
  );
}
