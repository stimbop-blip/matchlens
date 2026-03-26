import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { api, type Me, type NotificationSettings, type PromoApplyResult, type ReferralStats } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

function tariffLabel(value: string, language: "ru" | "en"): string {
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

function subscriptionStatusClass(value: string): string {
  if (value === "active") return "won";
  if (value === "expired" || value === "canceled") return "lost";
  return "pending";
}

export function ProfilePage() {
  const { language } = useLanguage();
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
      setNotifyMessage({ tone: "success", text: language === "ru" ? "Настройки сохранены" : "Settings saved" });
    } catch {
      setNotifyMessage({ tone: "error", text: language === "ru" ? "Не удалось сохранить настройки" : "Failed to save settings" });
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
      const text = e instanceof Error ? e.message : language === "ru" ? "Не удалось применить промокод" : "Promo apply failed";
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
    await navigator.clipboard.writeText(referral.referral_link);
    setNotifyMessage({ tone: "success", text: language === "ru" ? "Ссылка скопирована" : "Link copied" });
  };

  const isRu = language === "ru";

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>{isRu ? "Профиль" : "Profile"}</h2>
          <span className="muted">PIT BET</span>
        </div>

        {loading ? <p className="muted">{isRu ? "Загружаем профиль..." : "Loading profile..."}</p> : null}
        {!loading && !me ? <p className="empty-state">{isRu ? "Профиль временно недоступен." : "Profile is temporarily unavailable."}</p> : null}

        {me ? (
          <div className="profile-grid">
            <div className="profile-row">
              <span>{isRu ? "Пользователь" : "User"}</span>
              <strong>{me.first_name || "-"}</strong>
            </div>
            <div className="profile-row">
              <span>{isRu ? "Ник в Telegram" : "Telegram username"}</span>
              <strong>@{me.username || "-"}</strong>
            </div>
            <div className="profile-row">
              <span>{isRu ? "ID в Telegram" : "Telegram ID"}</span>
              <strong>{me.telegram_id}</strong>
            </div>
            <div className="profile-row">
              <span>{isRu ? "Роль" : "Role"}</span>
              <strong>{me.is_admin ? (isRu ? "Администратор" : "Admin") : isRu ? "Пользователь" : "User"}</strong>
            </div>
          </div>
        ) : null}

        {sub ? (
          <div className="subscription-box" id="subscription">
            <span className={`access-pill ${sub.tariff}`}>{tariffLabel(sub.tariff, language)}</span>
            <p>
              {isRu ? "Статус" : "Status"}: <span className={`badge ${subscriptionStatusClass(sub.status)}`}>{subscriptionStatusLabel(sub.status, language)}</span>
            </p>
            <p>
              {isRu ? "Доступ до" : "Valid until"}: {sub.ends_at ? new Date(sub.ends_at).toLocaleString(isRu ? "ru-RU" : "en-US") : "—"}
            </p>
          </div>
        ) : null}

        <div className="card-lite" style={{ marginTop: 10 }} id="referral">
          <h3 style={{ margin: 0 }}>{isRu ? "Реферальная программа" : "Referral program"}</h3>
          {!referral ? <p className="muted">{isRu ? "Данные недоступны." : "Data unavailable."}</p> : null}
          {referral ? (
            <div className="admin-form" style={{ marginTop: 8 }}>
              <p className="stacked">
                {isRu ? "Код" : "Code"}: <b>{referral.referral_code}</b>
              </p>
              <p className="stacked">
                {isRu ? "Приглашено" : "Invited"}: {referral.invited} • {isRu ? "Активировано" : "Activated"}: {referral.activated} • {isRu ? "Бонусные дни" : "Bonus days"}: {referral.bonus_days}
              </p>
              <input value={referral.referral_link} readOnly />
              <button className="btn ghost" onClick={copyReferral}>
                {isRu ? "Скопировать ссылку" : "Copy link"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="card-lite" style={{ marginTop: 10 }} id="promo">
          <h3 style={{ margin: 0 }}>{isRu ? "Промокод PIT BET" : "PIT BET promo code"}</h3>
          <p className="stacked">
            {isRu
              ? "Введите промокод, чтобы получить скидку на тариф или бонусные дни доступа."
              : "Enter a promo code to get a tariff discount or bonus access days."}
          </p>
          <div className="admin-form" style={{ marginTop: 8 }}>
            <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={isRu ? "Введите промокод" : "Enter promo code"} />
            <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
            <button className="btn" onClick={applyPromo}>
              {isRu ? "Применить промокод" : "Apply promo"}
            </button>
            {promoResult ? (
              <p className={`notice ${promoResult.ok ? "success" : "error"}`}>
                {promoResult.message}
                {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null ? ` ${isRu ? "Итог" : "Final"}: ${promoResult.final_price_rub} RUB.` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="card-lite" style={{ marginTop: 10 }} id="notifications">
          <h3 style={{ margin: 0 }}>{isRu ? "Уведомления" : "Notifications"}</h3>
          {!notify ? <p className="muted">{isRu ? "Настройки временно недоступны." : "Settings unavailable."}</p> : null}
          {notify ? (
            <div className="admin-form" style={{ marginTop: 8 }}>
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
              {notifyMessage ? <p className={`notice ${notifyMessage.tone}`}>{notifyMessage.text}</p> : null}
            </div>
          ) : null}
        </div>

        {me?.is_admin || me?.role === "admin" ? (
          <Link className="btn" to="/admin">
            {isRu ? "Перейти в админку" : "Open admin"}
          </Link>
        ) : null}
      </section>
      <AppDisclaimer />
    </Layout>
  );
}
