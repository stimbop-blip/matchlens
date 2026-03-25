import { Layout } from "../components/Layout";
import { useEffect, useState } from "react";

import { api, type Prediction } from "../services/api";

export function FeedPage() {
  const [items, setItems] = useState<Prediction[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api
      .predictions()
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <Layout>
      <section className="card">
        <h2>Лента прогнозов</h2>
        {error ? <p>{error}</p> : null}
        {items.length === 0 ? <p>Пока нет опубликованных прогнозов.</p> : null}
        {items.map((item) => (
          <article key={item.id} className="prediction-item">
            <strong>{item.title}</strong>
            <div>{item.match_name}</div>
            <div className="muted">
              {item.sport_type} • {item.access_level.toUpperCase()} • кф {item.odds}
            </div>
          </article>
        ))}
      </section>
    </Layout>
  );
}
