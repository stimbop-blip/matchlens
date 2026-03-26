import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api, type Me, type NotificationSettings } from "../services/api";
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
      Promise.all([api.me(), api.mySubscription(), api.myNotificationSettings()])
        .then(([meData, subData, notifyData]) => {
          if (!alive) return;
          setMe(meData);
          setSub(subData);
          setNotify(notifyData);
        })
        .catch(() => {
          if (!alive) return;
          setMe(null);
          setSub(null);
          setNotify(null);
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

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Профиль</h2>
          <span className="muted">Личный доступ и статус</span>
        </div>

        {loading ? <p className="muted">Загружаем профиль...</p> : null}
        {!loading && !me ? <p className="empty-state">Профиль временно недоступен.</p> : null}

        {me ? (
          <div className="profile-grid">
            <div className="profile-row">
              <span>Пользователь</span>
              <strong>{me.first_name || "-"}</strong>
            </div>
            <div className="profile-row">
              <span>Username</span>
              <strong>@{me.username || "-"}</strong>
            </div>
            <div className="profile-row">
              <span>Telegram ID</span>
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
          <h3 style={{ margin: 0 }}>Уведомления</h3>
          {!notify ? <p className="muted">Настройки уведомлений недоступны.</p> : null}
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
                <span>Новые бесплатные прогнозы</span>
                <input
                  type="checkbox"
                  checked={notify.notify_free}
                  onChange={async (e) => {
                    void updateNotify({ notify_free: e.target.checked });
                  }}
                />
              </label>
              <label className="switch-row">
                <span>Новые прогнозы Премиум</span>
                <input
                  type="checkbox"
                  checked={notify.notify_premium}
                  onChange={async (e) => {
                    void updateNotify({ notify_premium: e.target.checked });
                  }}
                />
              </label>
              <label className="switch-row">
                <span>Новые прогнозы VIP</span>
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
