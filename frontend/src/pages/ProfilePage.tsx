import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, PromoCard, SectionActions, SectionHeader, SettingsSection, StatCard } from "../components/ui";
import { api, type Me, type MyPayment, type NotificationSettings, type PromoApplyResult, type ReferralStats } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

function tariffCode(value: string): "free" | "premium" | "vip" {
  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  return "free";
}

function tariffLabel(value: string): string {
  if (value === "premium") return "Premium";
  if (value === "vip") return "VIP";
  return "Free";
}

function subscriptionStatusLabel(value: string, language: "ru" | "en"): string {
  if (value === "active") return language === "ru" ? "Активен" : "Active";
  if (value === "expired") return language === "ru" ? "Истек" : "Expired";
  if (value === "canceled") return language === "ru" ? "Отменен" : "Canceled";
  return language === "ru" ? "Не активен" : "Inactive";
}

function paymentStatusLabel(value: string, language: "ru" | "en"): string {
  if (value === "pending_manual_review") return language === "ru" ? "Ожидает подтверждения" : "Pending manual review";
  if (value === "requires_clarification") return language === "ru" ? "Ожидает уточнения" : "Needs clarification";
  if (value === "succeeded") return language === "ru" ? "Подтвержден" : "Confirmed";
  if (value === "failed") return language === "ru" ? "Отклонен" : "Rejected";
  if (value === "canceled") return language === "ru" ? "Отменен" : "Canceled";
  return language === "ru" ? "Ожидает оплаты" : "Awaiting payment";
}

function dateLabel(value: string | null | undefined, language: "ru" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US");
}

export function ProfilePage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [me, setMe] = useState<Me | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
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

      Promise.all([api.me(), api.mySubscription(), api.myNotificationSettings(), api.myReferral(), api.myPayments()])
        .then(([meData, subData, notifyData, referralData, paymentData]) => {
          if (!alive) return;
          setMe(meData);
          setSub(subData);
          setNotify(notifyData);
          setReferral(referralData);
          setPayments(paymentData);
        })
        .catch(() => {
          if (!alive) return;
          setMe(null);
          setSub(null);
          setNotify(null);
          setReferral(null);
          setPayments([]);
        })
        .finally(() => {
          if (!alive) return;
          setLoading(false);
        });
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const updateNotify = async (payload: Partial<NotificationSettings>) => {
    try {
      const updated = await api.updateMyNotificationSettings(payload);
      setNotify(updated);
      setNotifyMessage({ tone: "success", text: isRu ? "Настройки сохранены" : "Settings saved" });
    } catch {
      setNotifyMessage({ tone: "error", text: isRu ? "Не удалось сохранить настройки" : "Failed to save settings" });
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
        setSub(subData);
        setReferral(referralData);
      }
    } catch (e) {
      const text = e instanceof Error ? e.message : isRu ? "Не удалось применить промокод" : "Promo apply failed";
      setPromoResult({ ok: false, mode: "error", kind: "error", code, message: text });
    }
  };

  const copyReferral = async () => {
    if (!referral?.referral_link) return;
    try {
      await navigator.clipboard.writeText(referral.referral_link);
      setNotifyMessage({ tone: "success", text: isRu ? "Ссылка скопирована" : "Link copied" });
    } catch {
      setNotifyMessage({ tone: "error", text: isRu ? "Не удалось скопировать ссылку" : "Failed to copy link" });
    }
  };

  const shareReferral = async () => {
    if (!referral?.referral_link) return;
    const shareText = isRu
      ? "Присоединяйся к PIT BET по моей реферальной ссылке."
      : "Join PIT BET using my referral link.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "PIT BET", text: shareText, url: referral.referral_link });
        return;
      }
      await navigator.clipboard.writeText(referral.referral_link);
      setNotifyMessage({ tone: "success", text: isRu ? "Ссылка готова к отправке" : "Link copied and ready to share" });
    } catch {
      setNotifyMessage({ tone: "error", text: isRu ? "Не удалось поделиться ссылкой" : "Failed to share link" });
    }
  };

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={isRu ? "Личный кабинет" : "Personal area"}
        description={
          isRu
            ? "Управляйте доступом, оплатами, бонусами и настройками аккаунта"
            : "Manage access, payments, bonuses, and account settings"
        }
        right={sub ? <AccessBadge level={tariffCode(sub.tariff)} label={tariffLabel(sub.tariff)} /> : undefined}
      >
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Статус" : "Status"} value={sub ? subscriptionStatusLabel(sub.status, language) : "—"} />
          <StatCard label={isRu ? "Доступ до" : "Valid until"} value={sub ? dateLabel(sub.ends_at, language) : "—"} tone="accent" />
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader title={isRu ? "Пользователь" : "User"} subtitle={loading ? (isRu ? "Загружаем данные..." : "Loading data...") : undefined} />
        {!loading && !me ? <p className="empty-state">{isRu ? "Профиль временно недоступен." : "Profile is temporarily unavailable."}</p> : null}

        {me ? (
          <div className="stack-list compact">
            <div className="info-row"><span>{isRu ? "Имя" : "Name"}</span><strong>{me.first_name || "—"}</strong></div>
            <div className="info-row"><span>{isRu ? "Username" : "Username"}</span><strong>{me.username ? `@${me.username}` : "—"}</strong></div>
            <div className="info-row"><span>Telegram ID</span><strong>{me.telegram_id}</strong></div>
            <div className="info-row"><span>{isRu ? "Роль" : "Role"}</span><strong>{me.is_admin ? (isRu ? "Администратор" : "Admin") : isRu ? "Пользователь" : "User"}</strong></div>
          </div>
        ) : null}

        {me?.is_admin || me?.role === "admin" ? (
          <SectionActions compact>
            <Link className="btn secondary" to="/admin">{isRu ? "Открыть админку" : "Open admin"}</Link>
          </SectionActions>
        ) : null}
      </AppShellSection>

      <AppShellSection id="subscription">
        <SectionHeader title={isRu ? "Подписка и оплаты" : "Subscription and payments"} subtitle={isRu ? "Текущий доступ и последние платежи" : "Current access and latest payments"} />
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Тариф" : "Tariff"} value={sub ? tariffLabel(sub.tariff) : "—"} tone="accent" />
          <StatCard label={isRu ? "Статус" : "Status"} value={sub ? subscriptionStatusLabel(sub.status, language) : "—"} />
          <StatCard label={isRu ? "Доступ до" : "Valid until"} value={sub ? dateLabel(sub.ends_at, language) : "—"} />
        </div>
        {payments.length === 0 ? <p className="empty-state">{isRu ? "Платежей пока нет." : "No payments yet."}</p> : null}
        {payments.slice(0, 4).map((item) => (
          <div className="info-row" key={item.id}>
            <span>{item.tariff_code.toUpperCase()} • {item.duration_days} {isRu ? "дней" : "days"} • {item.amount_rub} RUB</span>
            <strong>{paymentStatusLabel(item.status, language)}</strong>
            <small className="muted-line">{item.payment_method_name || item.payment_method_code || ""}</small>
            {item.review_comment ? <small className="muted-line">{item.review_comment}</small> : null}
          </div>
        ))}
      </AppShellSection>

      <AppShellSection id="referral">
        <SectionHeader title={isRu ? "Реферальная программа" : "Referral program"} subtitle={isRu ? "Бонусные дни за активацию приглашенных" : "Bonus days for activated invites"} />
        {!referral ? <p className="empty-state">{isRu ? "Данные недоступны." : "Data unavailable."}</p> : null}
        {referral ? (
          <>
            <div className="stat-grid compact">
              <StatCard label={isRu ? "Код" : "Code"} value={referral.referral_code} />
              <StatCard label={isRu ? "Приглашено" : "Invited"} value={referral.invited} />
              <StatCard label={isRu ? "Активировано" : "Activated"} value={referral.activated} />
              <StatCard label={isRu ? "Бонусные дни" : "Bonus days"} value={referral.bonus_days} tone="accent" />
            </div>
            <div className="input-stack">
              <input value={referral.referral_link} readOnly />
              <SectionActions compact>
                <button className="btn secondary" onClick={copyReferral} type="button">{isRu ? "Скопировать ссылку" : "Copy link"}</button>
                <button className="btn ghost" onClick={shareReferral} type="button">{isRu ? "Поделиться" : "Share"}</button>
              </SectionActions>
            </div>
          </>
        ) : null}
      </AppShellSection>

      <PromoCard
        title={isRu ? "Промокод PIT BET" : "PIT BET promo code"}
        description={isRu ? "Скидка или бонусные дни по промокоду" : "Discount or bonus days by promo code"}
      >
        <div className="input-stack" id="promo">
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={isRu ? "Введите промокод" : "Enter promo code"} />
          <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}> 
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
          <SectionActions compact>
            <button className="btn" onClick={applyPromo} type="button">{isRu ? "Применить" : "Apply"}</button>
          </SectionActions>
          {promoResult ? (
            <p className={`notice ${promoResult.ok ? "success" : "error"}`}>
              {promoResult.message}
              {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null ? ` ${isRu ? "Итог" : "Final"}: ${promoResult.final_price_rub} RUB.` : ""}
            </p>
          ) : null}
        </div>
      </PromoCard>

      <AppShellSection id="notifications">
        <SectionHeader title={isRu ? "Уведомления" : "Notifications"} subtitle={isRu ? "Компактные настройки категорий" : "Compact category settings"} />

        {!notify ? <p className="empty-state">{isRu ? "Настройки временно недоступны." : "Settings are unavailable."}</p> : null}

        {notify ? (
          <SettingsSection title={isRu ? "Категории" : "Categories"}>
            <label className="switch-row"><span>{isRu ? "Получать уведомления" : "Enable notifications"}</span><input type="checkbox" checked={notify.notifications_enabled} onChange={(e) => void updateNotify({ notifications_enabled: e.target.checked })} /></label>
            <label className="switch-row"><span>{isRu ? "Новые сигналы Free" : "New Free signals"}</span><input type="checkbox" checked={notify.notify_free} onChange={(e) => void updateNotify({ notify_free: e.target.checked })} /></label>
            <label className="switch-row"><span>{isRu ? "Новые сигналы Premium" : "New Premium signals"}</span><input type="checkbox" checked={notify.notify_premium} onChange={(e) => void updateNotify({ notify_premium: e.target.checked })} /></label>
            <label className="switch-row"><span>{isRu ? "Новые сигналы VIP" : "New VIP signals"}</span><input type="checkbox" checked={notify.notify_vip} onChange={(e) => void updateNotify({ notify_vip: e.target.checked })} /></label>
            <label className="switch-row"><span>{isRu ? "Результаты" : "Results"}</span><input type="checkbox" checked={notify.notify_results} onChange={(e) => void updateNotify({ notify_results: e.target.checked })} /></label>
            <label className="switch-row"><span>{isRu ? "Новости PIT BET" : "PIT BET news"}</span><input type="checkbox" checked={notify.notify_news} onChange={(e) => void updateNotify({ notify_news: e.target.checked })} /></label>
          </SettingsSection>
        ) : null}

        {notifyMessage ? <p className={`notice ${notifyMessage.tone}`}>{notifyMessage.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
