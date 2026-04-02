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
import { api, type Prediction, type PublicStats } from "../services/api";

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

function fallbackSignals(language: "ru" | "en"): Prediction[] {
  const now = Date.now();
  if (language === "ru") {
    return [
      {
        id: "fallback-1",
        title: "",
        match_name: "Real Madrid - Inter",
        league: "UEFA Champions League",
        sport_type: "football",
        event_start_at: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
        signal_type: "Тотал Больше 2.5",
        odds: 1.88,
        short_description: "Сильное движение линии и высокий темп матча.",
        bet_screenshot: null,
        result_screenshot: null,
        risk_level: "medium",
        access_level: "premium",
        status: "pending",
        mode: "prematch",
        published_at: null,
      },
      {
        id: "fallback-2",
        title: "",
        match_name: "Sinner - Rublev",
        league: "ATP 500",
        sport_type: "tennis",
        event_start_at: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
        signal_type: "Победа Sinner",
        odds: 1.72,
        short_description: "Устойчивое преимущество на приеме и по розыгрышам.",
        bet_screenshot: null,
        result_screenshot: null,
        risk_level: "low",
        access_level: "vip",
        status: "pending",
        mode: "live",
        published_at: null,
      },
    ];
  }

  return [
    {
      id: "fallback-1",
      title: "",
      match_name: "Real Madrid - Inter",
      league: "UEFA Champions League",
      sport_type: "football",
      event_start_at: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      signal_type: "Total Over 2.5",
      odds: 1.88,
      short_description: "Strong line movement and fast game tempo.",
      bet_screenshot: null,
      result_screenshot: null,
      risk_level: "medium",
      access_level: "premium",
      status: "pending",
      mode: "prematch",
      published_at: null,
    },
    {
      id: "fallback-2",
      title: "",
      match_name: "Sinner - Rublev",
      league: "ATP 500",
      sport_type: "tennis",
      event_start_at: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      signal_type: "Sinner to win",
      odds: 1.72,
      short_description: "Stable edge on return and rally profile.",
      bet_screenshot: null,
      result_screenshot: null,
      risk_level: "low",
      access_level: "vip",
      status: "pending",
      mode: "live",
      published_at: null,
    },
  ];
}

export function Home() {
  const { t, language } = useI18n();

  const [displayName, setDisplayName] = useState("PIT BET");
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [signals, setSignals] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.allSettled([api.me(), api.mySubscription(), api.stats(), api.predictions({ status: "pending", limit: 8 })])
      .then((results) => {
        if (!alive) return;

        const [meRes, subRes, statsRes, signalsRes] = results;

        if (meRes.status === "fulfilled") {
          setDisplayName(meRes.value.first_name || meRes.value.username || "PIT BET");
        }

        setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
        setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
        setSignals(signalsRes.status === "fulfilled" ? signalsRes.value : []);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subscriptionRaw);
  const accessProgress = sub.tariff === "vip" ? 100 : sub.tariff === "premium" ? 72 : 36;
  const activeSignals = useMemo(() => (signals.length > 0 ? signals.slice(0, 3) : fallbackSignals(language)), [language, signals]);

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
                <span className="pb-home-r3f-hero-art-chip">LIVE</span>
                <div className="pb-home-r3f-hero-art-meta">
                  <small>{language === "ru" ? "Активные сигналы" : "Active signals"}</small>
                  <strong>{stats?.pending ?? activeSignals.length}</strong>
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
            <small>{language === "ru" ? "3D-карточки с ключевыми метриками" : "3D cards with key metrics"}</small>
          </div>

          <div className="pb-home-r3f-signal-list">
            {activeSignals.map((signal) => (
              <ErrorBoundary key={signal.id} fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                  <SignalCard3D
                    to={signal.id.startsWith("fallback-") ? "/feed" : `/feed/${signal.id}`}
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
        </section>

        <AppDisclaimer />
      </Layout>
    </PageTransition>
  );
}
