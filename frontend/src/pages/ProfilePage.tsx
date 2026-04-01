import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";

import { useI18n } from "../app/i18n";
import { countPendingPayments, paymentStatusTone, resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ErrorBoundary } from "../components/motion/ErrorBoundary";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { PremiumRing } from "../components/premium/PremiumRing";
import { RocketLoader, SkeletonBlock } from "../components/ui";
import { api, type Me, type MyPayment, type NotificationSettings, type PromoApplyResult, type PublicStats, type ReferralStats } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

const FloatingHeroObject = lazy(() => import("../components/three/FloatingHeroObject").then((module) => ({ default: module.FloatingHeroObject })));
const ROIChart3D = lazy(() => import("../components/three/ROIChart3D").then((module) => ({ default: module.ROIChart3D })));
const SubscriptionProgress3D = lazy(() => import("../components/three/SubscriptionProgress3D").then((module) => ({ default: module.SubscriptionProgress3D })));

function formatDate(value: string | null | undefined, language: "ru" | "en"): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US");
}

function normalizeTariff(value: string): "free" | "premium" | "vip" {
  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  return "free";
}

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string): string {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function statusLabel(status: "active" | "expired" | "canceled" | "inactive" | "unknown", t: (key: string) => string): string {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

function paymentStatusLabel(status: string, t: (key: string) => string): string {
  if (status === "pending_manual_review") return t("common.payment.pending_manual_review");
  if (status === "requires_clarification") return t("common.payment.requires_clarification");
  if (status === "succeeded") return t("common.payment.succeeded");
  if (status === "failed") return t("common.payment.failed");
  if (status === "canceled") return t("common.payment.canceled");
  return t("common.payment.pending");
}

function buildAccessProgress(tariff: "free" | "premium" | "vip", isActive: boolean): number {
  const base = tariff === "vip" ? 100 : tariff === "premium" ? 70 : 34;
  if (isActive) return base;
  return Math.max(10, base - 24);
}

const TARIFF_WEIGHT: Record<"free" | "premium" | "vip", number> = {
  free: 0,
  premium: 1,
  vip: 2,
};

type NotificationControl = {
  key: keyof NotificationSettings;
  labelKey: string;
  minTariff: "free" | "premium" | "vip";
};

const NOTIFICATION_CONTROLS: NotificationControl[] = [
  { key: "notifications_enabled", labelKey: "profile.notifications.enable", minTariff: "free" },
  { key: "notify_free", labelKey: "profile.notifications.free", minTariff: "free" },
  { key: "notify_results", labelKey: "profile.notifications.results", minTariff: "free" },
  { key: "notify_news", labelKey: "profile.notifications.news", minTariff: "free" },
  { key: "notify_premium", labelKey: "profile.notifications.premium", minTariff: "premium" },
  { key: "notify_vip", labelKey: "profile.notifications.vip", minTariff: "vip" },
];

export function ProfilePage({ withThree = false }: { withThree?: boolean } = {}) {
  const { t, language } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [payments, setPayments] = useState<MyPayment[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoTariff, setPromoTariff] = useState<"free" | "premium" | "vip">("premium");
  const [promoResult, setPromoResult] = useState<PromoApplyResult | null>(null);
  const [notifyMessage, setNotifyMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive || !initData) {
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([api.me(), api.mySubscription(), api.myNotificationSettings(), api.myReferral(), api.myPayments(), api.stats()]);
      if (!alive) return;

      const [meRes, subRes, notifyRes, refRes, payRes, statsRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
      setPayments(payRes.status === "fulfilled" ? payRes.value : []);
      setStats(statsRes.status === "fulfilled" ? statsRes.value : null);
      setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subscriptionRaw);
  const pendingPayments = countPendingPayments(payments);
  const isAdmin = Boolean(me?.is_admin || me?.role === "admin");
  const isSupport = Boolean(me?.is_support || me?.role === "support");
  const isStaff = isAdmin || isSupport;
  const accessProgress = buildAccessProgress(sub.tariff, sub.is_active);
  const roiSeries = useMemo(() => {
    const hit = Math.max(1, Math.round(stats?.hit_rate ?? 0));
    const roi = Math.max(1, Math.round((stats?.roi ?? 0) + 20));
    const settled = Math.max(1, (stats?.wins ?? 0) + (stats?.refunds ?? 0));
    return [hit, roi, settled, pendingPayments + 1];
  }, [pendingPayments, stats]);

  const availableNotificationControls = useMemo(() => {
    const currentWeight = TARIFF_WEIGHT[sub.tariff];
    return NOTIFICATION_CONTROLS.map((item) => ({
      ...item,
      unlocked: currentWeight >= TARIFF_WEIGHT[item.minTariff],
    }));
  }, [sub.tariff]);

  const enabledNotifications = notify
    ? [notify.notifications_enabled, notify.notify_free, notify.notify_premium, notify.notify_vip, notify.notify_results, notify.notify_news].filter(Boolean).length
    : 0;

  const roleText = isAdmin ? t("profile.hero.roleAdmin") : isSupport ? t("profile.hero.roleSupport") : t("profile.hero.roleUser");

  const lockText = (minTariff: "free" | "premium" | "vip") => {
    if (minTariff === "vip") return t("profile.notifications.lockVip");
    if (minTariff === "premium") return t("profile.notifications.lockPremium");
    return t("profile.notifications.lockFree");
  };

  const updateNotify = async (payload: Partial<NotificationSettings>) => {
    try {
      const updated = await api.updateMyNotificationSettings(payload);
      setNotify(updated);
      setNotifyMessage({ tone: "success", text: t("profile.notifications.saved") });
    } catch {
      setNotifyMessage({ tone: "error", text: t("profile.notifications.failed") });
    }
  };

  const applyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;

    try {
      const result = await api.applyPromoCode({ code, tariff_code: promoTariff });
      setPromoResult(result);
      setPromoCode("");

      if (result.mode === "bonus_applied") {
        const [nextSub, nextRef] = await Promise.all([api.mySubscription(), api.myReferral()]);
        setSubscriptionRaw(nextSub);
        setReferral(nextRef);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t("profile.promo.failed");
      setPromoResult({ ok: false, mode: "error", kind: "error", code, message });
    }
  };

  const copyReferral = async () => {
    if (!referral?.referral_link) return;
    try {
      await navigator.clipboard.writeText(referral.referral_link);
      setNotifyMessage({ tone: "success", text: t("profile.referral.copyOk") });
    } catch {
      setNotifyMessage({ tone: "error", text: t("profile.referral.copyFail") });
    }
  };

  const shareReferral = async () => {
    if (!referral?.referral_link) return;

    try {
      if (navigator.share) {
        await navigator.share({ title: "PIT BET", text: t("profile.referral.shareText"), url: referral.referral_link });
      } else {
        await navigator.clipboard.writeText(referral.referral_link);
      }
      setNotifyMessage({ tone: "success", text: t("profile.referral.shareOk") });
    } catch {
      setNotifyMessage({ tone: "error", text: t("profile.referral.shareFail") });
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="pb-premium-panel pb-reveal">
          <RocketLoader title={t("profile.loadingTitle")} subtitle={t("profile.loadingSubtitle")} />
          <div className="pb-overview-kpi-skeleton" aria-hidden="true">
            <SkeletonBlock className="h-96" />
            <SkeletonBlock className="h-86" />
            <SkeletonBlock className="h-86" />
          </div>
        </section>
        <AppDisclaimer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-screen pb-screen-profile">
        <HeroPanel
        eyebrow={t("profile.hero.title")}
        title={me?.first_name || (me?.username ? `@${me.username}` : "PIT BET")}
        subtitle={t("profile.hero.subtitle")}
        right={<span className={`pb-tier-pill ${sub.tariff}`}>{tariffLabel(sub.tariff, t)}</span>}
      >
        <div className="pb-profile-v4-hero-scene">
          <div className="pb-profile-v4-user-prism" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="pb-profile-v4-tier-stack">
            <article>
              <small>{t("profile.snapshot.tariff")}</small>
              <strong>{tariffLabel(sub.tariff, t)}</strong>
            </article>
            <article>
              <small>{t("profile.snapshot.status")}</small>
              <strong>{statusLabel(sub.status, t)}</strong>
            </article>
            <article>
              <small>{t("profile.snapshot.pending")}</small>
              <strong>{pendingPayments}</strong>
            </article>
          </div>
        </div>

        <div className="pb-profile-v4-hero-grid">
          <PremiumKpi label={t("profile.hero.role")} value={roleText} tone={isStaff ? "accent" : "default"} />
          <PremiumKpi label={t("profile.hero.accessUntil")} value={formatDate(sub.ends_at, language)} />
          <PremiumKpi label={t("profile.snapshot.pending")} value={pendingPayments} tone={pendingPayments > 0 ? "warning" : "default"} />
          <PremiumKpi label={t("profile.notifications.title")} value={enabledNotifications} hint={notify ? "" : t("common.notAvailable")} />
        </div>

        <div className="pb-overview-hero-actions pb-profile-v4-actions">
          <Link className="pb-btn pb-btn-secondary" to="/tariffs">
            {t("profile.quick.tariffs")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/profile#referral">
            {t("profile.quick.referral")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/support">
            {t("profile.quick.support")}
          </Link>
          {isStaff ? (
            <Link className="pb-btn pb-btn-ghost" to="/support/inbox">
              {t("profile.support.inboxOpen")}
            </Link>
          ) : null}
          {isAdmin ? (
            <Link className="pb-btn pb-btn-ghost" to="/admin">
              {t("profile.admin.open")}
            </Link>
          ) : null}
        </div>
      </HeroPanel>

      {withThree ? (
        <section className="pb-premium-panel pb-profile-three pb-reveal">
          <div className="pb-premium-head">
            <h3>{language === "ru" ? "3D Аналитика профиля" : "3D profile analytics"}</h3>
            <small>{language === "ru" ? "Прогресс, ROI и премиум-метрики" : "Progress, ROI and premium metrics"}</small>
          </div>

          <div className="pb-profile-three-grid">
            <div className="pb-profile-three-trophy" aria-hidden="true">
              <ErrorBoundary fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                  <Canvas camera={{ position: [0, 0, 3], fov: 42 }} dpr={[1, 1.4]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
                    <ambientLight intensity={0.82} />
                    <pointLight position={[2, 2, 3]} intensity={1.1} color="#2cd8b7" />
                    <pointLight position={[-2, -1.2, 2.6]} intensity={0.82} color="#2f8cff" />
                    <FloatingHeroObject type="trophy" scale={0.9} />
                  </Canvas>
                </Suspense>
              </ErrorBoundary>
            </div>

            <ErrorBoundary fallback={<div className="pb-home-r3f-fallback">3D</div>}>
              <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                <ROIChart3D title={language === "ru" ? "ROI и эффективность" : "ROI and efficiency"} values={roiSeries} height={210} />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary fallback={<div className="pb-home-r3f-fallback">3D</div>}>
              <Suspense fallback={<div className="pb-home-r3f-fallback">3D</div>}>
                <SubscriptionProgress3D
                  percent={accessProgress}
                  label={language === "ru" ? "Прогресс подписки" : "Subscription progress"}
                  caption={statusLabel(sub.status, t)}
                  height={210}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </section>
      ) : null}

      <section className="pb-premium-panel pb-profile-v4-snapshot pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("profile.snapshot.title")}</h3>
          <small>{t("profile.snapshot.subtitle")}</small>
        </div>

        <div className="pb-overview-access-grid">
          <PremiumRing value={accessProgress} label={t("home.access.openNow")} caption={statusLabel(sub.status, t)} tone={sub.tariff === "vip" ? "vip" : "accent"} />

          <div className="pb-overview-access-metrics">
            <PremiumKpi label={t("profile.snapshot.tariff")} value={tariffLabel(sub.tariff, t)} tone={sub.tariff === "vip" ? "vip" : "accent"} />
            <PremiumKpi label={t("profile.snapshot.status")} value={statusLabel(sub.status, t)} tone={sub.is_active ? "success" : "warning"} />
            <PremiumKpi label={t("profile.snapshot.bonus")} value={`${referral?.bonus_days ?? 0} ${t("common.daysShort")}`} tone="success" />
            <PremiumKpi label={t("profile.snapshot.pending")} value={pendingPayments} />
          </div>
        </div>
      </section>

      <section className="pb-premium-panel pb-profile-v4-payments pb-reveal" id="subscription">
        <div className="pb-premium-head">
          <h3>{t("profile.subscription.title")}</h3>
          <small>{t("profile.subscription.subtitle")}</small>
        </div>

        {!me ? <p className="pb-empty-state">{t("profile.unavailable")}</p> : null}
        {payments.length === 0 ? <p className="pb-empty-state">{t("profile.subscription.historyEmpty")}</p> : null}

        <div className="pb-profile-v4-payment-list">
          {payments.slice(0, 6).map((payment) => (
            <article key={payment.id} className={`pb-profile-v4-payment ${paymentStatusTone(payment.status)}`}>
              <div>
                <strong>
                  {tariffLabel(normalizeTariff(payment.tariff_code), t)} · {payment.duration_days} {t("common.daysShort")} · {payment.amount_rub} RUB
                </strong>
                <p>
                  {t("profile.payment.method")}: {payment.payment_method_name || payment.payment_method_code || t("common.notAvailable")}
                </p>
                {payment.review_comment ? <p>{t("profile.payment.comment")}: {payment.review_comment}</p> : null}
              </div>
              <span>{paymentStatusLabel(payment.status, t)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-premium-panel pb-profile-v4-referral pb-reveal" id="referral">
        <div className="pb-premium-head">
          <h3>{t("profile.referral.title")}</h3>
          <small>{t("profile.referral.subtitle")}</small>
        </div>

        {!referral ? <p className="pb-empty-state">{t("profile.referral.empty")}</p> : null}

        {referral ? (
          <>
            <div className="pb-profile-v4-ref-grid">
              <PremiumKpi label={t("profile.referral.code")} value={referral.referral_code} tone="accent" />
              <PremiumKpi label={t("profile.referral.invited")} value={referral.invited} />
              <PremiumKpi label={t("profile.referral.activated")} value={referral.activated} tone="accent" />
              <PremiumKpi label={t("profile.referral.bonus")} value={`${referral.bonus_days} ${t("common.daysShort")}`} tone="success" />
            </div>

            <div className="pb-profile-v4-linkbox">
              <label>{t("profile.referral.link")}</label>
              <input value={referral.referral_link} readOnly />
              <div className="pb-overview-hero-actions">
                <button className="pb-btn pb-btn-secondary" type="button" onClick={copyReferral}>
                  {t("profile.referral.copy")}
                </button>
                <button className="pb-btn pb-btn-ghost" type="button" onClick={shareReferral}>
                  {t("profile.referral.share")}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="pb-premium-panel pb-profile-v4-promo pb-reveal" id="promo">
        <div className="pb-premium-head">
          <h3>{t("profile.promo.title")}</h3>
          <small>{t("profile.promo.subtitle")}</small>
        </div>

        <div className="pb-profile-v4-promo-grid">
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={t("profile.promo.placeholder")} />
          <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}>
            <option value="free">{t("common.free")}</option>
            <option value="premium">{t("common.premium")}</option>
            <option value="vip">{t("common.vip")}</option>
          </select>
          <button className="pb-btn pb-btn-primary" type="button" onClick={applyPromo}>
            {t("profile.promo.apply")}
          </button>
        </div>

        {promoResult ? (
          <p className={promoResult.ok ? "pb-notice success" : "pb-notice error"}>
            {promoResult.message}
            {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null ? ` ${t("profile.promo.final")}: ${promoResult.final_price_rub} RUB.` : ""}
          </p>
        ) : null}
      </section>

      <section className="pb-premium-panel pb-profile-v4-notify pb-reveal" id="notifications">
        <div className="pb-premium-head">
          <h3>{t("profile.notifications.title")}</h3>
          <small>{t("profile.notifications.subtitle")}</small>
        </div>

        {!notify ? <p className="pb-empty-state">{t("profile.notifications.empty")}</p> : null}

        {notify ? (
          <div className="pb-profile-v4-toggle-list">
            {availableNotificationControls.map((control) => {
              if (!control.unlocked) {
                return (
                  <div key={control.key} className="pb-profile-v4-toggle locked">
                    <span>
                      <strong>{t(control.labelKey)}</strong>
                      <small>{lockText(control.minTariff)}</small>
                    </span>
                    <input type="checkbox" checked={false} disabled readOnly />
                  </div>
                );
              }
              return (
                <label key={control.key} className="pb-profile-v4-toggle">
                  <span>{t(control.labelKey)}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(notify[control.key])}
                    onChange={(event) => void updateNotify({ [control.key]: event.target.checked } as Partial<NotificationSettings>)}
                  />
                </label>
              );
            })}
          </div>
        ) : null}

        {notifyMessage ? <p className={notifyMessage.tone === "success" ? "pb-notice success" : "pb-notice error"}>{notifyMessage.text}</p> : null}
      </section>

        <AppDisclaimer />
      </div>
    </Layout>
  );
}
