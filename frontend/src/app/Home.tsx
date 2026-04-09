import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { Grid2x2, ListChecks, Newspaper, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { useI18n } from "./i18n";
import { resolveSportKind, resolveSportLabel } from "./sport";
import { resolvePredictionCover } from "./sportArt";
import { resolveSubscriptionSnapshot } from "./subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { PageTransition } from "../components/motion/PageTransition";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
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

function predictionCover(signal: Prediction): { src: string; fallback: boolean } {
  return resolvePredictionCover({
    sport: signal.sport_type,
    betScreenshot: signal.bet_screenshot,
    resultScreenshot: signal.result_screenshot,
    variant: "landscape",
    seed: `${signal.id}:${signal.match_name}:${signal.league || ""}`,
  });
}

function formatOdds(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : String(value);
}

const FOOTBALL_HERO_IMAGE_FALLBACK = "/images/sports/121321313131.jpg";

function handleFootballHeroError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === "1") return;
  image.dataset.fallbackApplied = "1";
  image.src = FOOTBALL_HERO_IMAGE_FALLBACK;
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

          <AIScanningLoader className="pb-home-ai-hero" />

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

          {!loading && displaySignals.length > 0 ? (
            <div className="pb-telegram-gallery-grid">
              {displaySignals.map((signal) => {
                const cover = predictionCover(signal);
                const isFootball = resolveSportKind(signal.sport_type) === "football";
                return (
                  <Link
                    key={signal.id}
                    to={`/feed/${signal.id}`}
                    className={signal.risk_level === "low" ? "pb-home-luxe-card pb-home-luxe-card-neon" : "pb-home-luxe-card"}
                  >
                    <div className={isFootball ? "pb-home-luxe-media football" : "pb-home-luxe-media"} aria-hidden="true">
                      <img
                        className="pb-home-luxe-image"
                        src={cover.src}
                        alt=""
                        loading="lazy"
                        onError={isFootball ? handleFootballHeroError : undefined}
                      />
                      <span className={`pb-home-luxe-pill status ${signal.status}`}>{statusLabel(signal.status, t)}</span>
                      <span className="pb-home-luxe-pill access">{accessLabel(signal.access_level, t)}</span>
                      <div className="pb-home-luxe-media-row">
                        <span>{resolveSportLabel(signal.sport_type, language)}</span>
                        <span>{signal.mode === "live" ? t("common.live") : t("common.prematch")}</span>
                      </div>
                      {cover.fallback ? <span className="pb-home-luxe-art-tag">PIT BET ART</span> : null}
                    </div>

                    <div className="pb-home-luxe-body">
                      <small className="pb-home-luxe-league">{signal.league || t("feed.noLeague")}</small>
                      <strong className="pb-home-luxe-title">{signal.match_name}</strong>
                      <div className="pb-home-luxe-foot">
                        <span className="pb-home-luxe-pick">{signal.signal_type}</span>
                        <div className="pb-home-luxe-odds-wrap">
                          <small>{t("feed.label.odds")}</small>
                          <b>{formatOdds(signal.odds)}</b>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
