import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Grid2x2, ListChecks, Newspaper, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { useI18n } from "./i18n";
import { resolveSportLabel } from "./sport";
import { resolveSubscriptionSnapshot } from "./subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { PageTransition } from "../components/motion/PageTransition";
import { RocketLoader } from "../components/ui";
import { api, type NewsPost, type Prediction, type PublicStats } from "../services/api";

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

function sportCoverPalette(value: string): { start: string; end: string } {
  const sport = value.toLowerCase();
  if (sport.includes("football") || sport.includes("soccer")) return { start: "#0e3f7a", end: "#1d7cf2" };
  if (sport.includes("hockey")) return { start: "#114052", end: "#19a2d8" };
  if (sport.includes("basketball")) return { start: "#6d350f", end: "#d07a23" };
  if (sport.includes("tennis") && sport.includes("table")) return { start: "#5a2758", end: "#d14fab" };
  if (sport.includes("tennis")) return { start: "#1e5632", end: "#5eca58" };
  return { start: "#1b314f", end: "#0d7f9e" };
}

function sportCoverDataUri(sport: string): string {
  const icon = sportEmoji(sport);
  const palette = sportCoverPalette(sport);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 240'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${palette.start}'/><stop offset='100%' stop-color='${palette.end}'/></linearGradient><radialGradient id='r1' cx='0.82' cy='0.12' r='0.66'><stop offset='0%' stop-color='rgba(255,255,255,0.34)'/><stop offset='100%' stop-color='rgba(255,255,255,0)'/></radialGradient><radialGradient id='r2' cx='0.12' cy='0.98' r='0.7'><stop offset='0%' stop-color='rgba(0,0,0,0.26)'/><stop offset='100%' stop-color='rgba(0,0,0,0)'/></radialGradient></defs><rect width='420' height='240' rx='26' fill='url(#g)'/><rect width='420' height='240' rx='26' fill='url(#r1)'/><rect width='420' height='240' rx='26' fill='url(#r2)'/><circle cx='334' cy='44' r='26' fill='rgba(255,255,255,0.18)'/><circle cx='352' cy='188' r='44' fill='rgba(255,255,255,0.1)'/><circle cx='102' cy='72' r='44' fill='rgba(255,255,255,0.14)'/><text x='210' y='148' text-anchor='middle' font-size='96'>${icon}</text><text x='24' y='218' font-size='20' fill='rgba(255,255,255,0.74)' font-family='Arial, sans-serif'>PIT BET</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function predictionImage(signal: Prediction): string {
  if (signal.bet_screenshot) return signal.bet_screenshot;
  if (signal.result_screenshot) return signal.result_screenshot;
  return sportCoverDataUri(signal.sport_type);
}

function previewNews(value: string, maxLength = 160): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function Home() {
  const { t, language } = useI18n();

  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [signals, setSignals] = useState<Prediction[]>([]);
  const [signalSource, setSignalSource] = useState<"pending" | "won">("pending");
  const [newsItems, setNewsItems] = useState<NewsPost[]>([]);
  const [forecastFilter, setForecastFilter] = useState<"all" | "pending" | "won">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);

      try {
        const [subRes, statsRes, pendingRes, newsRes] = await Promise.allSettled([
          api.mySubscription(),
          api.stats(),
          api.predictions({ status: "pending", limit: 24 }),
          api.news(),
        ]);
        if (!alive) return;

        setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
        setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
        setNewsItems(newsRes.status === "fulfilled" ? newsRes.value : []);

        const pending = pendingRes.status === "fulfilled" ? pendingRes.value : [];

        if (pending.length > 0) {
          const pendingSorted = [...pending].sort((a, b) => predictionRecency(b) - predictionRecency(a)).slice(0, 2);
          if (pendingSorted.length >= 2) {
            setSignalSource("pending");
            setSignals(pendingSorted);
            return;
          }

          try {
            const wonForFill = await api.predictions({ status: "won", limit: 24 });
            if (!alive) return;
            const pendingIds = new Set(pendingSorted.map((item) => item.id));
            const wonSorted = [...wonForFill]
              .filter((item) => !pendingIds.has(item.id))
              .sort((a, b) => predictionRecency(b) - predictionRecency(a));

            setSignalSource("pending");
            setSignals([...pendingSorted, ...wonSorted].slice(0, 2));
            return;
          } catch {
            if (!alive) return;
            setSignalSource("pending");
            setSignals(pendingSorted);
            return;
          }
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

  const displaySignals = useMemo(() => {
    if (forecastFilter === "all") return activeSignals;
    const primary = activeSignals.filter((signal) => signal.status === forecastFilter);
    if (primary.length >= 2) return primary.slice(0, 2);
    const secondary = activeSignals.filter((signal) => signal.status !== forecastFilter);
    return [...primary, ...secondary].slice(0, 2);
  }, [activeSignals, forecastFilter]);

  const quickActions = useMemo(
    () => [
      { to: "/profile#center", label: language === "ru" ? "Меню" : "Menu", icon: Grid2x2 },
      { to: "/feed", label: language === "ru" ? "Сигналы" : "Signals", icon: ListChecks },
      { to: "/tariffs", label: language === "ru" ? "Тарифы" : "Tariffs", icon: Wallet },
      { to: "/stats", label: language === "ru" ? "Статистика" : "Stats", icon: Sparkles },
      { to: "/news", label: language === "ru" ? "Новости" : "News", icon: Newspaper },
      { to: "/support", label: language === "ru" ? "Поддержка" : "Support", icon: ShieldCheck },
    ],
    [language],
  );

  const subtitleText =
    language === "ru"
      ? "PIT BET — закрытый клуб спортивной аналитики. Мы отбираем сильные сигналы по движению линии, коэффициентам и игровому контексту."
      : "PIT BET is a private sports analytics club. We select strong signals by line movement, odds and match context.";

  return (
    <PageTransition>
      <Layout>
        <section className="pb-premium-panel pb-telegram-gallery pb-reveal">
          <div className="pb-telegram-hero-top">
            <span className={`pb-tier-pill ${sub.tariff}`}>{accessLabel(sub.tariff, t)}</span>
            <span className="pb-telegram-status-chip">{sub.is_active ? t("common.status.active") : t("common.status.expired")}</span>
          </div>

          <h3 className="pb-telegram-gallery-title">{language === "ru" ? "Главная" : "Home"}</h3>
          <p className="pb-telegram-gallery-subtitle">{subtitleText}</p>

          <div className="pb-telegram-tools-grid">
            {quickActions.map((item) => (
              <Link key={item.to} to={item.to} className="pb-telegram-tool-card">
                <span className="pb-telegram-tool-icon" aria-hidden="true">
                  <item.icon size={26} strokeWidth={2} />
                </span>
                <span className="pb-telegram-tool-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="pb-telegram-chip-row" role="tablist" aria-label={language === "ru" ? "Фильтр прогнозов" : "Forecast filter"}>
            <button
              type="button"
              className={forecastFilter === "all" ? "active" : ""}
              onClick={() => setForecastFilter("all")}
            >
              {language === "ru" ? "Все" : "All"}
            </button>
            <button
              type="button"
              className={forecastFilter === "pending" ? "active" : ""}
              onClick={() => setForecastFilter("pending")}
            >
              {language === "ru" ? "В ожидании" : "Pending"}
            </button>
            <button
              type="button"
              className={forecastFilter === "won" ? "active" : ""}
              onClick={() => setForecastFilter("won")}
            >
              {language === "ru" ? "Выигрыш" : "Won"}
            </button>
          </div>

          <p className="pb-telegram-forecast-note">{signalModeSubtitle}</p>

          <div className="pb-telegram-forecast-stats">
            <article>
              <small>{language === "ru" ? "Активные" : "Active"}</small>
              <strong>{stats?.pending ?? activeSignals.length}</strong>
            </article>
            <article>
              <small>{language === "ru" ? "Точность" : "Hit rate"}</small>
              <strong>{`${(stats?.hit_rate ?? 0).toFixed(1)}%`}</strong>
            </article>
            <article>
              <small>{language === "ru" ? "ROI" : "ROI"}</small>
              <strong>{`${(stats?.roi ?? 0).toFixed(1)}%`}</strong>
            </article>
            <article>
              <small>{language === "ru" ? "Победы" : "Wins"}</small>
              <strong>{stats?.wins ?? 0}</strong>
            </article>
          </div>

          {loading ? <RocketLoader title={t("home.loadingTitle")} subtitle={t("home.loadingSubtitle")} compact /> : null}

          {!loading && displaySignals.length > 0 ? (
            <div className="pb-telegram-gallery-grid">
              {displaySignals.map((signal) => (
                <Link
                  key={signal.id}
                  to={`/feed/${signal.id}`}
                  className="pb-telegram-gallery-card"
                >
                  <div className="pb-telegram-gallery-cover-wrap" aria-hidden="true">
                    <img className="pb-telegram-gallery-cover" src={predictionImage(signal)} alt={signal.match_name} loading="lazy" />
                    <span className="pb-telegram-gallery-badge">{statusLabel(signal.status, t)}</span>
                    <span className="pb-telegram-gallery-sport-pill">{resolveSportLabel(signal.sport_type, language)}</span>
                  </div>
                  <div className="pb-telegram-gallery-main">
                    <strong>{signal.match_name}</strong>
                    <p>{signal.league || t("feed.noLeague")}</p>
                    <small>{signal.mode === "live" ? t("common.live") : t("common.prematch")}</small>
                    <small className="pb-telegram-gallery-pick">{signal.signal_type}</small>
                  </div>
                  <div className="pb-telegram-gallery-foot">
                    <span className="pb-telegram-gallery-odds">{Number.isFinite(signal.odds) ? signal.odds.toFixed(2) : String(signal.odds)}</span>
                    <span className="pb-telegram-gallery-foot-label">{t("feed.label.odds")}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {!loading && displaySignals.length === 0 ? <p className="pb-empty-state">{t("home.today.empty")}</p> : null}
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
