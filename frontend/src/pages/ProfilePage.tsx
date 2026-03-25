import { Layout } from "../components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import { waitForTelegramInitData } from "../services/telegram";

export function ProfilePage() {
  const [me, setMe] = useState<{ first_name: string | null; username: string | null; role: string; is_admin: boolean; telegram_id: number } | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);

  useEffect(() => {
    let alive = true;

    const loadProfile = async () => {
      const initData = await waitForTelegramInitData();
      if (!alive) return;

      if (!initData) {
        setMe(null);
        setSub(null);
        return;
      }

      api.me().then((value) => alive && setMe(value)).catch(() => alive && setMe(null));
      api.mySubscription().then((value) => alive && setSub(value)).catch(() => alive && setSub(null));
    };

    void loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <Layout>
      <section className="card">
        <h2>Профиль</h2>
        {!me ? <p>Профиль недоступен.</p> : null}
        {me ? (
          <p>
            Пользователь: {me.first_name || "-"} (@{me.username || "-"}) • ID {me.telegram_id}
          </p>
        ) : null}
        {sub ? <p>Подписка: {sub.tariff.toUpperCase()} • {sub.status}</p> : null}
        {me?.is_admin || me?.role === "admin" ? (
          <p>
            <Link className="btn admin-link-btn" to="/admin">
              Перейти в админку
            </Link>
          </p>
        ) : null}
      </section>
    </Layout>
  );
}
