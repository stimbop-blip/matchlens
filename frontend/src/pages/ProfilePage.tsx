import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import {
  AccessBadge,
  AppShellSection,
  HeroCard,
  PromoCard,
  SectionActions,
  SectionHeader,
  SettingsSection,
  StatCard,
} from "../components/ui";
import { api, type Me, type NotificationSettings, type PromoApplyResult, type ReferralStats } from "../services/api";
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
  if (value === "active") return language === "ru" ? "Активна" : "Active";
  if (value === "expired") return language === "ru" ? "Истекла" : "Expired";
  if (value === "canceled") return language === "ru" ? "Отменена" : "Canceled";
  return language === "ru" ? "Не активна" : "Inactive";
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

      Promise.all([api.me(), api.mySubscription(), api.myNotificationSettings(), api.myReferral()])
        .then(([meData, subData, notifyData, referralData]) => {
          if (!alive) return;
          setMe(meData);
          setSub(subData);
          setNotify(notifyData);
          setReferral(referralData);
        })
        .catch(() => {
          if (!alive) return;
          setMe(null);
          setSub(null);
          setNotify(null);
          setReferral(null);
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
      setPromoResult({
        ok: false,
        mode: "error",
        kind: "error",
        code,
        message: text,
      });
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

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={isRu ? "Личный кабинет" : "Account center"}
        description={
          isRu
            ? "Управляйте доступом, уведомлениями, промокодами и реферальной программой."
            : "Manage access, notifications, promo codes, and referral program."
        }
        right={sub ? <AccessBadge level={tariffCode(sub.tariff)} label={tariffLabel(sub.tariff)} /> : undefined}
      >
        <div className="stack-list compact">
          <div className="info-row">
            <span>{isRu ? "Статус" : "Status"}</span>
            <strong>{sub ? subscriptionStatusLabel(sub.status, language) : "—"}</strong>
          </div>
          <div className="info-row">
            <span>{isRu ? "Доступ до" : "Valid until"}</span>
            <strong>{sub ? dateLabel(sub.ends_at, language) : "—"}</strong>
          </div>
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Пользователь" : "User profile"}
          subtitle={loading ? (isRu ? "Загружаем данные..." : "Loading data...") : undefined}
        />

        {!loading && !me ? <p className="empty-state">{isRu ? "Профиль временно недоступен." : "Profile is temporarily unavailable."}</p> : null}

        {me ? (
          <div className="stack-list">
            <div className="info-row">
              <span>{isRu ? "Имя" : "Name"}</span>
              <strong>{me.first_name || "—"}</strong>
            </div>
            <div className="info-row">
              <span>{isRu ? "Ник в Telegram" : "Telegram username"}</span>
              <strong>{me.username ? `@${me.username}` : "—"}</strong>
            </div>
            <div className="info-row">
              <span>Telegram ID</span>
              <strong>{me.telegram_id}</strong>
            </div>
            <div className="info-row">
              <span>{isRu ? "Роль" : "Role"}</span>
              <strong>{me.is_admin ? (isRu ? "Администратор" : "Admin") : isRu ? "Пользователь" : "User"}</strong>
            </div>
          </div>
        ) : null}

        {me?.is_admin || me?.role === "admin" ? (
          <SectionActions compact>
            <Link className="btn secondary" to="/admin">
              {isRu ? "Открыть админку" : "Open admin"}
            </Link>
          </SectionActions>
        ) : null}
      </AppShellSection>

      <AppShellSection id="subscription">
        <SectionHeader
          title={isRu ? "Текущий доступ" : "Current access"}
          subtitle={isRu ? "Тариф, статус и срок действия" : "Tariff, status, and validity"}
        />
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Тариф" : "Tariff"} value={sub ? tariffLabel(sub.tariff) : "—"} tone="accent" />
          <StatCard label={isRu ? "Статус" : "Status"} value={sub ? subscriptionStatusLabel(sub.status, language) : "—"} />
          <StatCard label={isRu ? "Доступ до" : "Valid until"} value={sub ? dateLabel(sub.ends_at, language) : "—"} />
        </div>
      </AppShellSection>

      <AppShellSection id="referral">
        <SectionHeader
          title={isRu ? "Рефералы и бонусы" : "Referrals and bonuses"}
          subtitle={isRu ? "Код, ссылка и прогресс приглашений" : "Code, link, and referral progress"}
        />
        {!referral ? <p className="empty-state">{isRu ? "Данные недоступны." : "Data unavailable."}</p> : null}
        {referral ? (
          <>
            <div className="stack-list compact">
              <div className="info-row">
                <span>{isRu ? "Реферальный код" : "Referral code"}</span>
                <strong>{referral.referral_code}</strong>
              </div>
            </div>
            <div className="stat-grid compact">
              <StatCard label={isRu ? "Приглашено" : "Invited"} value={referral.invited} />
              <StatCard label={isRu ? "Активировано" : "Activated"} value={referral.activated} />
              <StatCard label={isRu ? "Бонусные дни" : "Bonus days"} value={referral.bonus_days} tone="accent" />
            </div>
            <div className="input-stack">
              <input value={referral.referral_link} readOnly />
              <SectionActions compact>
                <button className="btn secondary" onClick={copyReferral} type="button">
                  {isRu ? "Скопировать ссылку" : "Copy link"}
                </button>
              </SectionActions>
            </div>
          </>
        ) : null}
      </AppShellSection>

      <PromoCard
        title={isRu ? "Промокод PIT BET" : "PIT BET promo code"}
        description={
          isRu
            ? "Введите промокод, чтобы получить скидку или бонусные дни доступа."
            : "Enter a promo code to get a discount or bonus access days."
        }
      >
        <p className="muted-line">{isRu ? "Используйте промокод для скидки на тариф или бонусных дней." : "Use a promo code for tariff discount or bonus days."}</p>
        <div className="input-stack" id="promo">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder={isRu ? "Введите промокод" : "Enter promo code"}
          />
          <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
          <SectionActions compact>
            <button className="btn" onClick={applyPromo} type="button">
              {isRu ? "Применить" : "Apply"}
            </button>
          </SectionActions>
          {promoResult ? (
            <p className={`notice ${promoResult.ok ? "success" : "error"}`}>
              {promoResult.message}
              {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null
                ? ` ${isRu ? "Итог" : "Final"}: ${promoResult.final_price_rub} RUB.`
                : ""}
            </p>
          ) : null}
          <p className="muted-line">{isRu ? "История активаций доступна в уведомлениях и событиях аккаунта." : "Activation history is available in your account events and notifications."}</p>
        </div>
      </PromoCard>

      <AppShellSection id="notifications">
        <SectionHeader title={isRu ? "Уведомления" : "Notifications"} />

        {!notify ? <p className="empty-state">{isRu ? "Настройки временно недоступны." : "Settings are unavailable."}</p> : null}

        {notify ? (
          <SettingsSection title={isRu ? "Категории" : "Categories"}>
            <label className="switch-row">
              <span>{isRu ? "Получать уведомления" : "Enable notifications"}</span>
              <input type="checkbox" checked={notify.notifications_enabled} onChange={(e) => void updateNotify({ notifications_enabled: e.target.checked })} />
            </label>
            <label className="switch-row">
              <span>{isRu ? "Новые сигналы Free" : "New Free signals"}</span>
              <input type="checkbox" checked={notify.notify_free} onChange={(e) => void updateNotify({ notify_free: e.target.checked })} />
            </label>
            <label className="switch-row">
              <span>{isRu ? "Новые сигналы Premium" : "New Premium signals"}</span>
              <input type="checkbox" checked={notify.notify_premium} onChange={(e) => void updateNotify({ notify_premium: e.target.checked })} />
            </label>
            <label className="switch-row">
              <span>{isRu ? "Новые сигналы VIP" : "New VIP signals"}</span>
              <input type="checkbox" checked={notify.notify_vip} onChange={(e) => void updateNotify({ notify_vip: e.target.checked })} />
            </label>
            <label className="switch-row">
              <span>{isRu ? "Результаты" : "Results"}</span>
              <input type="checkbox" checked={notify.notify_results} onChange={(e) => void updateNotify({ notify_results: e.target.checked })} />
            </label>
            <label className="switch-row">
              <span>{isRu ? "Новости PIT BET" : "PIT BET news"}</span>
              <input type="checkbox" checked={notify.notify_news} onChange={(e) => void updateNotify({ notify_news: e.target.checked })} />
            </label>
          </SettingsSection>
        ) : null}

        {notifyMessage ? <p className={`notice ${notifyMessage.tone}`}>{notifyMessage.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
