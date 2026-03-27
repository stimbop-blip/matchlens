import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { resolveSubscriptionSnapshot } from "../app/subscription";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, PromoCard, SectionActions, SectionHeader, SettingsSection, StatCard } from "../components/ui";
import { api, type Me, type MyPayment, type NotificationSettings, type PromoApplyResult, type ReferralStats } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

function formatDate(value: string | null | undefined, language: "ru" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US");
}

function tariffLabel(level: "free" | "premium" | "vip", t: (key: string) => string) {
  if (level === "premium") return t("common.premium");
  if (level === "vip") return t("common.vip");
  return t("common.free");
}

function normalizeTariff(value: string): "free" | "premium" | "vip" {
  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  return "free";
}

function statusLabel(status: "active" | "expired" | "canceled" | "inactive" | "unknown", t: (key: string) => string) {
  if (status === "active") return t("common.status.active");
  if (status === "expired") return t("common.status.expired");
  if (status === "canceled") return t("common.status.canceled");
  if (status === "inactive") return t("common.status.inactive");
  return t("common.status.unknown");
}

function paymentStatusLabel(value: string, t: (key: string) => string) {
  if (value === "pending_manual_review") return t("common.payment.pending_manual_review");
  if (value === "requires_clarification") return t("common.payment.requires_clarification");
  if (value === "succeeded") return t("common.payment.succeeded");
  if (value === "failed") return t("common.payment.failed");
  if (value === "canceled") return t("common.payment.canceled");
  return t("common.payment.pending");
}

export function ProfilePage() {
  const { t, language } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [subRaw, setSubRaw] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [notify, setNotify] = useState<NotificationSettings | null>(null);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoTariff, setPromoTariff] = useState<"free" | "premium" | "vip">("premium");
  const [promoResult, setPromoResult] = useState<PromoApplyResult | null>(null);
  const [payments, setPayments] = useState<MyPayment[]>([]);
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
      const results = await Promise.allSettled([
        api.me(),
        api.mySubscription(),
        api.myNotificationSettings(),
        api.myReferral(),
        api.myPayments(),
      ]);
      if (!alive) return;

      const [meRes, subRes, notifyRes, referralRes, paymentsRes] = results;
      setMe(meRes.status === "fulfilled" ? meRes.value : null);
      setSubRaw(subRes.status === "fulfilled" ? subRes.value : null);
      setNotify(notifyRes.status === "fulfilled" ? notifyRes.value : null);
      setReferral(referralRes.status === "fulfilled" ? referralRes.value : null);
      setPayments(paymentsRes.status === "fulfilled" ? paymentsRes.value : []);
      setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const sub = resolveSubscriptionSnapshot(subRaw);

  const updateNotify = async (payload: Partial<NotificationSettings>) => {
    try {
      const updated = await api.updateMyNotificationSettings(payload);
      setNotify(updated);
      setNotifyMessage({ tone: "success", text: t("profile.notifications.saved") });
    } catch {
      setNotifyMessage({ tone: "error", text: t("profile.notifications.fail") });
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
        const [subData, referralData] = await Promise.all([api.mySubscription(), api.myReferral()]);
        setSubRaw(subData);
        setReferral(referralData);
      }
    } catch (e) {
      const text = e instanceof Error ? e.message : t("profile.promo.fail");
      setPromoResult({ ok: false, mode: "error", kind: "error", code, message: text });
    }
  };

  const copyReferral = async () => {
    if (!referral?.referral_link) return;
    try {
      await navigator.clipboard.writeText(referral.referral_link);
      setNotifyMessage({ tone: "success", text: t("profile.ref.copy.ok") });
    } catch {
      setNotifyMessage({ tone: "error", text: t("profile.ref.copy.fail") });
    }
  };

  const shareReferral = async () => {
    if (!referral?.referral_link) return;
    const shareText = t("profile.ref.share.text");
    try {
      if (navigator.share) {
        await navigator.share({ title: "PIT BET", text: shareText, url: referral.referral_link });
        return;
      }
      await navigator.clipboard.writeText(referral.referral_link);
      setNotifyMessage({ tone: "success", text: t("profile.ref.share.ok") });
    } catch {
      setNotifyMessage({ tone: "error", text: t("profile.ref.share.fail") });
    }
  };

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={t("profile.hero.title")}
        description={t("profile.hero.subtitle")}
        right={<AccessBadge level={sub.tariff} label={tariffLabel(sub.tariff, t)} />}
      >
        <div className="stat-grid compact">
          <StatCard label={t("profile.sub.status")} value={statusLabel(sub.status, t)} />
          <StatCard label={t("profile.sub.until")} value={formatDate(sub.ends_at, language)} tone="accent" />
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader title={t("profile.user.title")} subtitle={loading ? t("common.loading") : undefined} />
        {!loading && !me ? <p className="empty-state">{t("profile.user.unavailable")}</p> : null}

        {me ? (
          <div className="stack-list compact">
            <div className="info-row"><span>{t("profile.user.name")}</span><strong>{me.first_name || "—"}</strong></div>
            <div className="info-row"><span>{t("profile.user.username")}</span><strong>{me.username ? `@${me.username}` : "—"}</strong></div>
            <div className="info-row"><span>{t("profile.user.telegramId")}</span><strong>{me.telegram_id}</strong></div>
            <div className="info-row"><span>{t("profile.user.role")}</span><strong>{me.is_admin ? t("profile.user.roleAdmin") : t("profile.user.roleUser")}</strong></div>
          </div>
        ) : null}

        {me?.is_admin || me?.role === "admin" ? (
          <SectionActions compact>
            <Link className="btn secondary" to="/admin">{t("profile.openAdmin")}</Link>
          </SectionActions>
        ) : null}
      </AppShellSection>

      <AppShellSection id="subscription">
        <SectionHeader title={t("profile.sub.title")} subtitle={t("profile.sub.subtitle")} />
        <div className="stat-grid compact">
          <StatCard label={t("profile.sub.tariff")} value={tariffLabel(sub.tariff, t)} tone="accent" />
          <StatCard label={t("profile.sub.status")} value={statusLabel(sub.status, t)} />
          <StatCard label={t("profile.sub.until")} value={formatDate(sub.ends_at, language)} />
        </div>
        {payments.length === 0 ? <p className="empty-state">{t("profile.payments.empty")}</p> : null}
        {payments.slice(0, 4).map((item) => (
          <div className="info-row" key={item.id}>
            <span>{tariffLabel(normalizeTariff(item.tariff_code), t)} • {item.duration_days} {t("tariffs.days")} • {item.amount_rub} RUB</span>
            <strong>{paymentStatusLabel(item.status, t)}</strong>
            <small className="muted-line">{item.payment_method_name || item.payment_method_code || ""}</small>
            {item.review_comment ? <small className="muted-line">{item.review_comment}</small> : null}
          </div>
        ))}
      </AppShellSection>

      <AppShellSection id="referral">
        <SectionHeader title={t("profile.ref.title")} subtitle={t("profile.ref.subtitle")} />
        {!referral ? <p className="empty-state">{t("profile.ref.empty")}</p> : null}
        {referral ? (
          <>
            <div className="stat-grid compact">
              <StatCard label={t("profile.ref.code")} value={referral.referral_code} />
              <StatCard label={t("profile.ref.invited")} value={referral.invited} />
              <StatCard label={t("profile.ref.activated")} value={referral.activated} />
              <StatCard label={t("profile.ref.bonus")} value={referral.bonus_days} tone="accent" />
            </div>
            <div className="input-stack">
              <input value={referral.referral_link} readOnly />
              <SectionActions compact>
                <button className="btn secondary" onClick={copyReferral} type="button">{t("profile.ref.copy")}</button>
                <button className="btn ghost" onClick={shareReferral} type="button">{t("profile.ref.share")}</button>
              </SectionActions>
            </div>
          </>
        ) : null}
      </AppShellSection>

      <PromoCard title={t("profile.promo.title")} description={t("profile.promo.subtitle")}>
        <div className="input-stack" id="promo">
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={t("profile.promo.placeholder")} />
          <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}> 
            <option value="free">{t("common.free")}</option>
            <option value="premium">{t("common.premium")}</option>
            <option value="vip">{t("common.vip")}</option>
          </select>
          <SectionActions compact>
            <button className="btn" onClick={applyPromo} type="button">{t("profile.promo.apply")}</button>
          </SectionActions>
          {promoResult ? (
            <p className={`notice ${promoResult.ok ? "success" : "error"}`}>
              {promoResult.message}
              {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null ? ` ${t("profile.promo.final")}: ${promoResult.final_price_rub} RUB.` : ""}
            </p>
          ) : null}
        </div>
      </PromoCard>

      <AppShellSection id="notifications">
        <SectionHeader title={t("profile.notifications.title")} subtitle={t("profile.notifications.subtitle")} />

        {!notify ? <p className="empty-state">{t("profile.notifications.empty")}</p> : null}

        {notify ? (
          <SettingsSection title={t("profile.notifications.title")}>
            <label className="switch-row"><span>{t("profile.notifications.enable")}</span><input type="checkbox" checked={notify.notifications_enabled} onChange={(e) => void updateNotify({ notifications_enabled: e.target.checked })} /></label>
            <label className="switch-row"><span>{t("profile.notifications.free")}</span><input type="checkbox" checked={notify.notify_free} onChange={(e) => void updateNotify({ notify_free: e.target.checked })} /></label>
            <label className="switch-row"><span>{t("profile.notifications.premium")}</span><input type="checkbox" checked={notify.notify_premium} onChange={(e) => void updateNotify({ notify_premium: e.target.checked })} /></label>
            <label className="switch-row"><span>{t("profile.notifications.vip")}</span><input type="checkbox" checked={notify.notify_vip} onChange={(e) => void updateNotify({ notify_vip: e.target.checked })} /></label>
            <label className="switch-row"><span>{t("profile.notifications.results")}</span><input type="checkbox" checked={notify.notify_results} onChange={(e) => void updateNotify({ notify_results: e.target.checked })} /></label>
            <label className="switch-row"><span>{t("profile.notifications.news")}</span><input type="checkbox" checked={notify.notify_news} onChange={(e) => void updateNotify({ notify_news: e.target.checked })} /></label>
          </SettingsSection>
        ) : null}

        {notifyMessage ? <p className={`notice ${notifyMessage.tone}`}>{notifyMessage.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
