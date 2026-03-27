import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { countPendingPayments, resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  AccessBadge,
  ActivityBand,
  AnimatedNumber,
  AppShellSection,
  CTACluster,
  MarketPulse,
  NewsRibbon,
  SectionHeader,
  Sparkline,
} from "../components/ui";
import { api, type Me, type MyPayment, type NewsPost, type Prediction, type PublicStats, type ReferralStats } from "../services/api";

function formatDate(value: string | null | undefined, language: "ru" | "en", fallback: string) {
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

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string) {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function statusLabel(status: "active" | "expired" | "canceled" | "inactive" | "unknown", t: (key: string) => string) {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

export function HomePage() {
  const { t, language } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [payments, setPayments] = useState<MyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.me(),
        api.stats(),
        api.mySubscription(),
        api.myReferral(),
        api.news(),
        api.predictions({ limit: 180 }),
        api.myPayments(),
      ]);
      if (!alive) return;

      const [meRes, statsRes, subRes, refRes, newsRes, predRes, payRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setNews(newsRes.status === "fulfilled" ? newsRes.value : []);
      setPredictions(predRes.status === "fulfilled" ? predRes.value : []);
      setPayments(payRes.status === "fulfilled" ? payRes.value : []);
      setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subscriptionRaw);
  const pendingPayments = countPendingPayments(payments);

  const pendingSignals = predictions.filter((item) => item.status === "pending");
  const liveNow = pendingSignals.filter((item) => item.mode === "live").length;
  const freeCount = pendingSignals.filter((item) => item.access_level === "free").length;
  const premiumCount = pendingSignals.filter((item) => item.access_level === "premium").length;
  const vipCount = pendingSignals.filter((item) => item.access_level === "vip").length;

  const settledToday = useMemo(() => {
    const today = new Date();
    return predictions.filter((item) => {
      if (item.status === "pending") return false;
      const base = item.published_at ? new Date(item.published_at) : new Date(item.event_start_at);
      if (Number.isNaN(base.getTime())) return false;
      return isSameDay(base, today);
    }).length;
  }, [predictions]);

  const previewNews = news.slice(0, 2);

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-brand-chip large">PIT BET</span>
          <AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />
        </div>

        <h2>{t("home.hero.headline")}</h2>
        <p>{t("home.hero.subheadline")}</p>

        <MarketPulse label={t("stats.hero.pulse")} values={[76, 72, 69, 61, 66, 58, 52, 47, 41, 44, 37]} tag={t("common.live")} />

        <ActivityBand
          items={[
            { label: t("home.hero.status"), value: statusLabel(sub.status, t), tone: sub.is_active ? "success" : "warning" },
            { label: t("home.hero.until"), value: formatDate(sub.ends_at, language, "—") },
            { label: t("home.hero.pendingPayments"), value: pendingPayments, tone: pendingPayments > 0 ? "warning" : "accent" },
          ]}
        />

        <CTACluster>
          <Link className="pb-btn pb-btn-primary" to="/feed">
            {t("home.hero.ctaSignals")}
          </Link>
          <Link className="pb-btn pb-btn-secondary" to="/profile">
            {t("home.hero.ctaAccess")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/menu">
            {t("home.hero.ctaHub")}
          </Link>
        </CTACluster>
      </section>

      <AppShellSection className="pb-today-panel">
        <SectionHeader title={t("home.today.title")} subtitle={t("home.today.subtitle")} />
        <div className="pb-today-grid">
          <article className="pb-today-main">
            <span>{t("home.today.active")}</span>
            <AnimatedNumber value={pendingSignals.length} />
          </article>

          <div className="pb-today-stack">
            <article>
              <span>{t("home.today.liveNow")}</span>
              <AnimatedNumber value={liveNow} />
            </article>
            <article>
              <span>{t("home.today.free")}</span>
              <AnimatedNumber value={freeCount} />
            </article>
            <article>
              <span>{t("home.today.premium")}</span>
              <AnimatedNumber value={premiumCount} />
            </article>
            <article>
              <span>{t("home.today.vip")}</span>
              <AnimatedNumber value={vipCount} />
            </article>
            <article>
              <span>{t("home.today.settled")}</span>
              <AnimatedNumber value={settledToday} />
            </article>
          </div>
        </div>
      </AppShellSection>

      <AppShellSection className="pb-story-panel">
        <SectionHeader title={t("home.story.title")} subtitle={t("home.story.subtitle")} />
        <div className="pb-story-grid">
          <article>
            <h3>{t("home.story.p1.title")}</h3>
            <p>{t("home.story.p1.text")}</p>
          </article>
          <article>
            <h3>{t("home.story.p2.title")}</h3>
            <p>{t("home.story.p2.text")}</p>
          </article>
          <article>
            <h3>{t("home.story.p3.title")}</h3>
            <p>{t("home.story.p3.text")}</p>
          </article>
          <article>
            <h3>{t("home.story.p4.title")}</h3>
            <p>{t("home.story.p4.text")}</p>
          </article>
        </div>
      </AppShellSection>

      <div className="pb-home-split">
        <AppShellSection>
          <SectionHeader title={t("home.access.title")} subtitle={t("home.access.subtitle")} />
          <div className="pb-info-list">
            <div>
              <span>{t("home.access.tariff")}</span>
              <strong>{tariffLabel(sub.tariff, t)}</strong>
            </div>
            <div>
              <span>{t("home.access.status")}</span>
              <strong>{statusLabel(sub.status, t)}</strong>
            </div>
            <div>
              <span>{t("home.access.until")}</span>
              <strong>{formatDate(sub.ends_at, language, "—")}</strong>
            </div>
            <div>
              <span>{t("home.access.bonus")}</span>
              <strong>{referral?.bonus_days ?? 0}</strong>
            </div>
            <div>
              <span>{t("home.access.pending")}</span>
              <strong>{pendingPayments}</strong>
            </div>
          </div>
          <CTACluster>
            <Link className="pb-btn pb-btn-secondary" to="/profile">
              {t("home.access.action")}
            </Link>
          </CTACluster>
        </AppShellSection>

        <AppShellSection>
          <SectionHeader title={t("home.performance.title")} subtitle={t("home.performance.subtitle")} />
          <div className="pb-metric-grid">
            <article>
              <span>{t("home.performance.total")}</span>
              <AnimatedNumber value={stats?.total ?? 0} />
            </article>
            <article>
              <span>{t("home.performance.hit")}</span>
              <AnimatedNumber value={stats?.hit_rate ?? 0} suffix="%" decimals={1} />
            </article>
            <article>
              <span>{t("common.roi")}</span>
              <AnimatedNumber value={stats?.roi ?? 0} suffix="%" decimals={1} />
            </article>
            <article>
              <span>{t("home.performance.ratio")}</span>
              <strong>{`${stats?.wins ?? 0}/${stats?.loses ?? 0}/${stats?.refunds ?? 0}`}</strong>
            </article>
          </div>
          <Sparkline values={[46, 53, 49, 58, 54, 66, 60, 71, 65, 74]} className="pb-sparkline-band" />
          <CTACluster>
            <Link className="pb-btn pb-btn-ghost" to="/stats">
              {t("home.performance.action")}
            </Link>
          </CTACluster>
        </AppShellSection>
      </div>

      <AppShellSection>
        <SectionHeader title={t("home.news.title")} action={<Link className="pb-link-inline" to="/news">{t("home.news.all")}</Link>} />

        {loading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}

        {!loading && previewNews.length === 0 ? <p className="pb-empty-state">{t("home.news.empty")}</p> : null}

        {previewNews.length > 0 ? (
          <div className="pb-news-grid">
            {previewNews.map((item) => (
              <NewsRibbon
                key={item.id}
                title={item.title}
                body={item.body}
                category={item.category}
                meta={formatDate(item.published_at, language, t("common.noDate"))}
                to={`/news/${item.id}`}
              />
            ))}
          </div>
        ) : null}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("home.ref.title")} subtitle={t("home.ref.subtitle")} />
        <ActivityBand
          items={[
            { label: t("home.ref.invited"), value: referral?.invited ?? 0 },
            { label: t("home.ref.activated"), value: referral?.activated ?? 0, tone: "accent" },
            { label: t("home.ref.bonus"), value: referral?.bonus_days ?? 0, tone: "success" },
          ]}
        />
        <CTACluster>
          <Link className="pb-btn pb-btn-ghost" to="/profile#referral">
            {t("home.ref.action")}
          </Link>
        </CTACluster>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
