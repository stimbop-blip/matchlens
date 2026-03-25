import { Layout } from "../components/Layout";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

export function ProfilePage() {
  const [me, setMe] = useState<{ first_name: string | null; username: string | null; role: string; telegram_id: number } | null>(null);
  const [sub, setSub] = useState<{ tariff: string; status: string; ends_at: string | null } | null>(null);

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null));
    api.mySubscription().then(setSub).catch(() => setSub(null));
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
        {me?.role === "admin" ? (
          <p>
            <Link to="/admin">Открыть админку</Link>
          </p>
        ) : null}
      </section>
    </Layout>
  );
}
