import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { countPendingPayments, paymentStatusTone, resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, ActivityBand, AppShellSection, CTACluster, RocketLoader, SectionHeader, SkeletonBlock, ToggleRow } from "../components/ui";
import { api, type Me, type MyPayment, type NotificationSettings, type PromoApplyResult, type ReferralStats } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

function formatDate(value: string | null | undefined, language: "ru" | "en") {
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

function paymentStatusLabel(status: string, t: (key: string) => string) {
  if (status === "pending_manual_review") return t("common.payment.pending_manual_review");
  if (status === "requires_clarification") return t("common.payment.requires_clarification");
  if (status === "succeeded") return t("common.payment.succeeded");
  if (status === "failed") return t("common.payment.failed");
  if (status === "canceled") return t("common.payment.canceled");
  return t("common.payment.pending");
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

export function ProfilePage() {
  const { t, language } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [subscriptionRaw, setSubscriptionRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [payments, setPayments] = useState<MyPayment[]>([]);

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

      const results = await Promise.allSettled([api.me(), api.mySubscription(), api.myNotificationSettings(), api.myReferral(), api.myPayments()]);
      if (!alive) return;

      const [meRes, subRes, notifyRes, refRes, payRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setSubscriptionRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(refRes.status === "fulfilled" ? refRes.value : null);
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
  const referralStatus = `${referral?.invited ?? 0}/${referral?.activated ?? 0}`;

  const availableNotificationControls = useMemo(() => {
    const currentWeight = TARIFF_WEIGHT[sub.tariff];
    return NOTIFICATION_CONTROLS.map((item) => ({
      ...item,
      unlocked: currentWeight >= TARIFF_WEIGHT[item.minTariff],
    }));
  }, [sub.tariff]);

  const lockText = (minTariff: "free" | "premium" | "vip") => {
    if (minTariff === "vip") return t("profile.notifications.lockVip");
    if (minTariff === "premium") return t("profile.notifications.lockPremium");
    return t("profile.notifications.lockFree");
  };

  if (loading) {
    return (
      <Layout>
        <AppShellSection>
          <RocketLoader title={t("profile.loadingTitle")} subtitle={t("profile.loadingSubtitle")} />
          <div className="pb-profile-skeleton" aria-hidden="true">
            <SkeletonBlock className="w-55 h-56" />
            <SkeletonBlock className="w-44 h-56" />
            <SkeletonBlock className="w-90 h-64" />
          </div>
        </AppShellSection>
        <AppDisclaimer />
      </Layout>
    );
  }

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

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">{t("profile.hero.title")}</span>
          <AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />
        </div>

        <h2>{me?.first_name || (me?.username ? `@${me.username}` : "PIT BET")}</h2>
        <p>{t("profile.hero.subtitle")}</p>

        <ActivityBand
          items={[
            { label: t("profile.hero.role"), value: me?.is_admin || me?.role === "admin" ? t("profile.hero.roleAdmin") : t("profile.hero.roleUser") },
            { label: t("profile.hero.accessUntil"), value: formatDate(sub.ends_at, language) },
            { label: t("common.status.pending"), value: pendingPayments, tone: pendingPayments > 0 ? "warning" : "accent" },
          ]}
        />

        <CTACluster>
          <Link className="pb-btn pb-btn-secondary" to="/tariffs">
            {t("profile.quick.tariffs")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/profile#referral">
            {t("profile.quick.referral")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/profile#notifications">
            {t("profile.quick.notifications")}
          </Link>
        </CTACluster>

        {me?.is_admin || me?.role === "admin" ? (
          <CTACluster>
            <Link className="pb-btn pb-btn-ghost" to="/admin">
              {t("profile.admin.open")}
            </Link>
          </CTACluster>
        ) : null}
      </section>

      <AppShellSection>
        <SectionHeader title={t("profile.snapshot.title")} subtitle={t("profile.snapshot.subtitle")} />
        <ActivityBand
          items={[
            { label: t("profile.snapshot.tariff"), value: tariffLabel(sub.tariff, t), tone: "accent" },
            { label: t("profile.snapshot.status"), value: statusLabel(sub.status, t), tone: sub.is_active ? "success" : "warning" },
            { label: t("profile.snapshot.bonus"), value: referral?.bonus_days ?? 0 },
            { label: t("profile.snapshot.pending"), value: pendingPayments, tone: pendingPayments > 0 ? "warning" : "default" },
            { label: t("profile.snapshot.referral"), value: referralStatus },
            { label: t("profile.snapshot.promo"), value: promoResult?.ok ? t("common.status.active") : t("common.status.inactive") },
          ]}
        />
      </AppShellSection>

      <AppShellSection id="subscription">
        <SectionHeader title={t("profile.subscription.title")} subtitle={t("profile.subscription.subtitle")} />

        {!loading && !me ? <p className="pb-empty-state">{t("profile.unavailable")}</p> : null}
        {!loading && payments.length === 0 ? <p className="pb-empty-state">{t("profile.subscription.historyEmpty")}</p> : null}

        {payments.slice(0, 6).map((payment) => (
          <article key={payment.id} className={"pb-payment-row " + paymentStatusTone(payment.status)}>
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
      </AppShellSection>

      <AppShellSection id="referral">
        <SectionHeader title={t("profile.referral.title")} subtitle={t("profile.referral.subtitle")} />

        {!referral ? <p className="pb-empty-state">{t("profile.referral.empty")}</p> : null}

        {referral ? (
          <>
            <div className="pb-info-list">
              <div>
                <span>{t("profile.referral.code")}</span>
                <strong>{referral.referral_code}</strong>
              </div>
              <div>
                <span>{t("profile.referral.invited")}</span>
                <strong>{referral.invited}</strong>
              </div>
              <div>
                <span>{t("profile.referral.activated")}</span>
                <strong>{referral.activated}</strong>
              </div>
              <div>
                <span>{t("profile.referral.bonus")}</span>
                <strong>{referral.bonus_days}</strong>
              </div>
            </div>

            <div className="pb-input-stack">
              <label>{t("profile.referral.link")}</label>
              <input value={referral.referral_link} readOnly />
              <CTACluster>
                <button className="pb-btn pb-btn-secondary" type="button" onClick={copyReferral}>
                  {t("profile.referral.copy")}
                </button>
                <button className="pb-btn pb-btn-ghost" type="button" onClick={shareReferral}>
                  {t("profile.referral.share")}
                </button>
              </CTACluster>
            </div>
          </>
        ) : null}
      </AppShellSection>

      <AppShellSection id="promo">
        <SectionHeader title={t("profile.promo.title")} subtitle={t("profile.promo.subtitle")} />
        <div className="pb-input-stack">
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={t("profile.promo.placeholder")} />
          <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}>
            <option value="free">{t("common.free")}</option>
            <option value="premium">{t("common.premium")}</option>
            <option value="vip">{t("common.vip")}</option>
          </select>

          <CTACluster>
            <button className="pb-btn pb-btn-primary" type="button" onClick={applyPromo}>
              {t("profile.promo.apply")}
            </button>
          </CTACluster>

          {promoResult ? (
            <p className={promoResult.ok ? "pb-notice success" : "pb-notice error"}>
              {promoResult.message}
              {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null ? ` ${t("profile.promo.final")}: ${promoResult.final_price_rub} RUB.` : ""}
            </p>
          ) : null}
        </div>
      </AppShellSection>

      <AppShellSection id="notifications">
        <SectionHeader title={t("profile.notifications.title")} subtitle={t("profile.notifications.subtitle")} />

        {!notify ? <p className="pb-empty-state">{t("profile.notifications.empty")}</p> : null}

        {notify ? (
          <div className="pb-toggle-list">
            {availableNotificationControls.map((control) => {
              if (!control.unlocked) {
                return (
                  <div key={control.key} className="pb-toggle-row locked">
                    <span>
                      <strong>{t(control.labelKey)}</strong>
                      <small>{lockText(control.minTariff)}</small>
                    </span>
                    <input type="checkbox" checked={false} disabled readOnly />
                  </div>
                );
              }
              return (
                <ToggleRow
                  key={control.key}
                  label={t(control.labelKey)}
                  checked={Boolean(notify[control.key])}
                  onChange={(next) => void updateNotify({ [control.key]: next } as Partial<NotificationSettings>)}
                />
              );
            })}
          </div>
        ) : null}

        {notifyMessage ? <p className={notifyMessage.tone === "success" ? "pb-notice success" : "pb-notice error"}>{notifyMessage.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
