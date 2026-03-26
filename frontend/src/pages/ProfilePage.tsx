import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api, type Me, type NotificationSettings, type PromoApplyResult, type ReferralStats } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

function tariffLabel(value: string): string {
  if (value === "premium") return "Премиум";
  if (value === "vip") return "VIP";
  return "Бесплатный";
}

function subscriptionStatusLabel(value: string): string {
  if (value === "active") return "Активна";
  if (value === "expired") return "Истекла";
  if (value === "canceled") return "Отменена";
  return value;
}

function subscriptionStatusClass(value: string): string {
  if (value === "active") return "won";
  if (value === "expired" || value === "canceled") return "lost";
  return "pending";
}

export function ProfilePage() {
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
      setNotifyMessage({ tone: "success", text: "Настройки сохранены" });
    } catch {
      setNotifyMessage({ tone: "error", text: "Не удалось сохранить настройки" });
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
      const text = e instanceof Error ? e.message : "Не удалось применить промокод";
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
    setNotifyMessage({ tone: "success", text: "Реферальная ссылка скопирована" });
  };

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Профиль</h2>
          <span className="muted">Доступ PIT BET и ваши настройки</span>
        </div>

        {loading ? <p className="muted">Загружаем профиль PIT BET...</p> : null}
        {!loading && !me ? <p className="empty-state">Профиль временно недоступен. Откройте Mini App из Telegram и попробуйте еще раз.</p> : null}

        {me ? (
          <div className="profile-grid">
            <div className="profile-row">
              <span>Пользователь</span>
              <strong>{me.first_name || "-"}</strong>
            </div>
            <div className="profile-row">
              <span>Ник в Telegram</span>
              <strong>@{me.username || "-"}</strong>
            </div>
            <div className="profile-row">
              <span>ID в Telegram</span>
              <strong>{me.telegram_id}</strong>
            </div>
            <div className="profile-row">
              <span>Роль</span>
              <strong>{me.is_admin ? "Администратор" : "Пользователь"}</strong>
            </div>
          </div>
        ) : null}

        {sub ? (
          <div className="subscription-box">
            <span className={`access-pill ${sub.tariff}`}>{tariffLabel(sub.tariff)}</span>
            <p>
              Статус: <span className={`badge ${subscriptionStatusClass(sub.status)}`}>{subscriptionStatusLabel(sub.status)}</span>
            </p>
            <p>Доступ до: {sub.ends_at ? new Date(sub.ends_at).toLocaleString("ru-RU") : "—"}</p>
          </div>
        ) : null}

        <div className="card-lite" style={{ marginTop: 10 }}>
          <h3 style={{ margin: 0 }}>Реферальная программа PIT BET</h3>
          {!referral ? <p className="muted">Реферальные данные недоступны.</p> : null}
          {referral ? (
            <div className="admin-form" style={{ marginTop: 8 }}>
              <p className="stacked">
                Код: <b>{referral.referral_code}</b>
              </p>
              <p className="stacked">Приглашено: {referral.invited} • Активировано: {referral.activated} • Бонусные дни: {referral.bonus_days}</p>
              <input value={referral.referral_link} readOnly />
              <button className="btn ghost" onClick={copyReferral}>
                Скопировать ссылку
              </button>
            </div>
          ) : null}
        </div>

        <div className="card-lite" style={{ marginTop: 10 }}>
          <h3 style={{ margin: 0 }}>Промокод PIT BET</h3>
          <p className="stacked">Введите промокод, чтобы получить скидку на тариф или бонусные дни доступа.</p>
          <div className="admin-form" style={{ marginTop: 8 }}>
            <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Введите промокод" />
            <select value={promoTariff} onChange={(e) => setPromoTariff(e.target.value as "free" | "premium" | "vip")}>
              <option value="free">Тариф Free</option>
              <option value="premium">Тариф Premium</option>
              <option value="vip">Тариф VIP</option>
            </select>
            <button className="btn" onClick={applyPromo}>
              Применить промокод
            </button>
            {promoResult ? (
              <p className={`notice ${promoResult.ok ? "success" : "error"}`}>
                {promoResult.message}
                {promoResult.final_price_rub !== undefined && promoResult.final_price_rub !== null
                  ? ` Итог: ${promoResult.final_price_rub} RUB.`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="card-lite" style={{ marginTop: 10 }}>
          <h3 style={{ margin: 0 }}>Уведомления PIT BET</h3>
          {!notify ? <p className="muted">Настройки уведомлений PIT BET временно недоступны.</p> : null}
          {notify ? (
            <div className="admin-form" style={{ marginTop: 8 }}>
              <label className="switch-row">
                <span>Получать уведомления</span>
                <input
                  type="checkbox"
                  checked={notify.notifications_enabled}
                  onChange={async (e) => {
                    void updateNotify({ notifications_enabled: e.target.checked });
                  }}
                />
              </label>
              <label className="switch-row">
                <span>Новые сигналы Free</span>
                <input
                  type="checkbox"
                  checked={notify.notify_free}
                  onChange={async (e) => {
                    void updateNotify({ notify_free: e.target.checked });
                  }}
                />
              </label>
              <label className="switch-row">
                <span>Новые сигналы Premium</span>
                <input
                  type="checkbox"
                  checked={notify.notify_premium}
                  onChange={async (e) => {
                    void updateNotify({ notify_premium: e.target.checked });
                  }}
                />
              </label>
              <label className="switch-row">
                <span>Новые сигналы VIP</span>
                <input
                  type="checkbox"
                  checked={notify.notify_vip}
                  onChange={async (e) => {
                    void updateNotify({ notify_vip: e.target.checked });
                  }}
                />
              </label>
              <label className="switch-row">
                <span>Результаты (выигрыш/проигрыш/возврат)</span>
                <input
                  type="checkbox"
                  checked={notify.notify_results}
                  onChange={async (e) => {
                    void updateNotify({ notify_results: e.target.checked });
                  }}
                />
              </label>
              {notifyMessage ? <p className={`notice ${notifyMessage.tone}`}>{notifyMessage.text}</p> : null}
            </div>
          ) : null}
        </div>

        {me?.is_admin || me?.role === "admin" ? (
          <Link className="btn" to="/admin">
            Перейти в админку
          </Link>
        ) : null}
      </section>
    </Layout>
  );
}
