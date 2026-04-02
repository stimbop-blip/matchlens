import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "./i18n";
import { resolveSubscriptionSnapshot } from "./subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { PageTransition } from "../components/motion/PageTransition";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { RocketLoader } from "../components/ui";
import { api, type NewsPost, type Prediction, type PublicStats } from "../services/api";

const SubscriptionProgress3D = lazy(() => import("../components/three/SubscriptionProgress3D").then((module) => ({ default: module.SubscriptionProgress3D })));
const SignalCard3D = lazy(() => import("../components/three/SignalCard3D").then((module) => ({ default: module.SignalCard3D })));

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
  const accessProgress = sub.tariff === "vip" ? 100 : sub.tariff === "premium" ? 72 : 36;
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
  const signalChip = signalSource === "pending" ? "LIVE" : "WON";
  const signalCounter = signalSource === "pending" ? (stats?.pending ?? activeSignals.length) : activeSignals.length;

  const subtitleText =
    language === "ru"
      ? "Премиум-центр сигналов с 3D аналитикой и быстрым доступом к ставкам"
      : "Premium signal center with 3D analytics and instant betting workflow";

  return (
    <PageTransition>
      <Layout>
        <HeroPanel
          eyebrow="PIT BET 3D"
          title={`${language === "ru" ? "Добро пожаловать" : "Welcome back"}, ${displayName}`}
          subtitle={subtitleText}
          right={<span className={`pb-tier-pill ${sub.tariff}`}>{accessLabel(sub.tariff, t)}</span>}
        >
          <div className="pb-home-r3f-hero-grid">
            <div className="pb-home-r3f-hero-copy">
              <h3>{language === "ru" ? "Командный premium-режим активен" : "Command premium mode is active"}</h3>
              <p>{t("home.hero.subheadline")}</p>
            </div>

            <div className="pb-home-r3f-hero-object" aria-hidden="true">
              <div className="pb-home-r3f-hero-art">
                <span className="pb-home-r3f-hero-art-halo" />
                <span className="pb-home-r3f-hero-art-core" />
                <span className="pb-home-r3f-hero-art-chip">{signalChip}</span>
                <div className="pb-home-r3f-hero-art-meta">
                  <small>{signalSource === "pending" ? (language === "ru" ? "Матчи в ожидании" : "Pending matches") : (language === "ru" ? "Выигранные" : "Won matches")}</small>
                  <strong>{signalCounter}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-overview-kpi-grid">
            <PremiumKpi label={t("home.today.active")} value={stats?.pending ?? signals.length} tone="accent" />
            <PremiumKpi label={t("home.performance.hit")} value={`${(stats?.hit_rate ?? 0).toFixed(1)}%`} tone="success" />
            <PremiumKpi label={t("common.roi")} value={`${(stats?.roi ?? 0).toFixed(1)}%`} tone="vip" />
          </div>

          <div className="pb-overview-hero-actions">
            <Link className="pb-btn pb-btn-primary" to="/feed">
              {t("home.hero.ctaSignals")}
            </Link>
            <Link className="pb-btn pb-btn-secondary" to="/tariffs">
              {t("layout.main.openTariffs")}
            </Link>
            <Link className="pb-btn pb-btn-ghost" to="/profile">
              {t("layout.main.openProfile")}
            </Link>
          </div>
        </HeroPanel>

        <section className="pb-premium-panel pb-home-r3f-subscription pb-reveal">
          <div className="pb-premium-head">
            <h3>{language === "ru" ? "Текущая подписка" : "Current subscription"}</h3>
            <small>{language === "ru" ? "Живой прогресс доступа" : "Live access progress"}</small>
          </div>

          {loading ? <RocketLoader title={t("home.loadingTitle")} subtitle={t("home.loadingSubtitle")} compact /> : null}

          {!loading ? (
            <ErrorBoundary fallback={<div className="pb-home-r3f-fallback">3D</div>}>
              <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                <SubscriptionProgress3D
                  percent={accessProgress}
                  label={language === "ru" ? "Доступ открыт" : "Access unlocked"}
                  caption={sub.status === "active" ? t("common.status.active") : t("common.status.expired")}
                  height={230}
                />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </section>

        <section className="pb-premium-panel pb-home-r3f-signals pb-reveal">
          <div className="pb-premium-head">
            <h3>{language === "ru" ? "Последние сигналы" : "Latest signals"}</h3>
            <small>{signalModeSubtitle}</small>
          </div>

          {activeSignals.length > 0 ? (
            <div className="pb-home-r3f-signal-list">
              {activeSignals.map((signal) => (
                <ErrorBoundary key={signal.id} fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                  <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                    <SignalCard3D
                      to={`/feed/${signal.id}`}
                      title={signal.match_name}
                      league={signal.league || t("feed.noLeague")}
                      sport={signal.sport_type}
                      mode={signal.mode === "live" ? t("common.live") : t("common.prematch")}
                      kickoff={formatDate(signal.event_start_at, language)}
                      signal={signal.signal_type}
                      odds={signal.odds}
                      oddsLabel={t("feed.label.odds")}
                      risk={riskLabel(signal.risk_level, t)}
                      status={signal.status}
                      statusLabel={statusLabel(signal.status, t)}
                      accessLabel={accessLabel(signal.access_level, t)}
                      note={teaser(signal.short_description, t("feed.teaserFallback"))}
                      language={language}
                    />
                  </Suspense>
                </ErrorBoundary>
              ))}
            </div>
          ) : (
            <p className="pb-empty-state">{t("home.today.empty")}</p>
          )}
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
