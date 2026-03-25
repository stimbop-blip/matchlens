import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Layout } from "../components/Layout";
import { api, type Me } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

export function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive || !initData) {
        setLoading(false);
        return;
      }
      Promise.all([api.me(), api.mySubscription()])
        .then(([meData, subData]) => {
          if (!alive) return;
          setMe(meData);
          setSub(subData);
        })
        .catch(() => {
          if (!alive) return;
          setMe(null);
          setSub(null);
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

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Профиль</h2>
          <span className="muted">Личный доступ и статус</span>
        </div>

        {loading ? <p>Загружаем профиль...</p> : null}
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
              <strong>{me.is_admin ? "admin" : me.role}</strong>
            </div>
          </div>
        ) : null}

        {sub ? (
          <div className="subscription-box">
            <span className={`access-pill ${sub.tariff}`}>{sub.tariff.toUpperCase()}</span>
            <p>Статус: {sub.status}</p>
            <p>Доступ до: {sub.ends_at ? new Date(sub.ends_at).toLocaleString("ru-RU") : "—"}</p>
          </div>
        ) : null}

        {me?.is_admin || me?.role === "admin" ? (
          <Link className="btn" to="/admin">
            Перейти в админку
          </Link>
        ) : null}
      </section>
    </Layout>
  );
}
