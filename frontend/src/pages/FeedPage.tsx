import { useEffect, useMemo, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type Prediction } from "../services/api";

const FILTERS = {
  mode: ["all", "prematch", "live"],
  status: ["all", "pending", "won", "lost", "refund"],
} as const;

function statusClass(status: string) {
  if (status === "won") return "badge success";
  if (status === "lost") return "badge danger";
  if (status === "refund") return "badge warning";
  return "badge";
}

export function FeedPage() {
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<(typeof FILTERS.mode)[number]>("all");
  const [status, setStatus] = useState<(typeof FILTERS.status)[number]>("all");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .predictions({ mode: mode === "all" ? undefined : mode, status: status === "all" ? undefined : status })
      .then((data) => setItems(data))
      .catch((e: Error) => setError(e.message || "Не удалось загрузить ленту"))
      .finally(() => setLoading(false));
  }, [mode, status]);

  const hasPremiumItems = useMemo(() => items.some((item) => item.access_level !== "free"), [items]);

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Лента прогнозов</h2>
          <span className="muted">{items.length} позиций</span>
        </div>

        <div className="filter-row">
          <label>
            Формат
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              {FILTERS.mode.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {FILTERS.status.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? <p>Загрузка ленты...</p> : null}
        {error ? <p className="error-msg">{error}</p> : null}
        {!loading && !error && items.length === 0 ? <p className="empty-state">Нет прогнозов по выбранным фильтрам.</p> : null}

        {items.map((item) => (
          <article key={item.id} className="prediction-card">
            <div className="prediction-top">
              <strong>{item.match_name}</strong>
              <span className={`access-pill ${item.access_level}`}>{item.access_level.toUpperCase()}</span>
            </div>
            <div className="meta-row">
              <span>{item.sport_type}</span>
              <span>{item.league || "Без лиги"}</span>
              <span>{new Date(item.event_start_at).toLocaleString("ru-RU")}</span>
            </div>
            <div className="signal-row">
              <div>
                <small>Сигнал</small>
                <p>{item.signal_type}</p>
              </div>
              <div>
                <small>Коэффициент</small>
                <p>{item.odds}</p>
              </div>
              <div>
                <small>Риск</small>
                <p>{item.risk_level}</p>
              </div>
            </div>
            {item.short_description ? <p className="desc">{item.short_description}</p> : null}
            <div className="prediction-bottom">
              <span className={statusClass(item.status)}>{item.status}</span>
              <span className="badge">{item.mode}</span>
            </div>
          </article>
        ))}

        {!loading && hasPremiumItems ? null : (
          <aside className="paywall-box">
            <h3>Больше сигналов в Premium и VIP</h3>
            <p>Закрытые позиции доступны в расширенных планах с приоритетом обновлений.</p>
          </aside>
        )}
      </section>
    </Layout>
  );
}
