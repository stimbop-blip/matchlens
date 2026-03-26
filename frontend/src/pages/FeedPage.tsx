import { useEffect, useMemo, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type Prediction } from "../services/api";

type ModeFilter = "all" | "prematch" | "live";
type StatusFilter = "all" | "pending" | "won" | "lost" | "refund";

function statusLabel(status: Prediction["status"]): string {
  if (status === "won") return "Выигрыш";
  if (status === "lost") return "Проигрыш";
  if (status === "refund") return "Возврат";
  return "В ожидании";
}

function statusClass(status: Prediction["status"]): string {
  if (status === "won") return "won";
  if (status === "lost") return "lost";
  if (status === "refund") return "refund";
  return "pending";
}

function modeLabel(mode: Prediction["mode"]): string {
  return mode === "live" ? "Live" : "Прематч";
}

function accessLabel(access: Prediction["access_level"]): string {
  if (access === "premium") return "Премиум";
  if (access === "vip") return "VIP";
  return "Бесплатный";
}

function formatKickoff(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayHeading(date: Date): string {
  const now = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Завтра";
  if (diffDays === -1) return "Вчера";
  return target.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

export function FeedPage() {
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .predictions({ mode: mode === "all" ? undefined : mode, status: status === "all" ? undefined : status })
      .then(setItems)
      .catch((e: Error) => setError(e.message || "Не удалось загрузить прогнозы"))
      .finally(() => setLoading(false));
  }, [mode, status]);

  const groups = useMemo(() => {
    const map = new Map<string, Prediction[]>();
    items.forEach((item) => {
      const date = new Date(item.event_start_at);
      const key = dayHeading(date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>Лента прогнозов</h2>
          <span className="muted">{items.length} позиций PIT BET</span>
        </div>
        <p className="stacked">
          Лента отражает рыночный контекст: движение линии, коэффициенты и отбор сильных игровых ситуаций.
        </p>

        <div className="filter-row">
          <label>
            Формат
            <select value={mode} onChange={(e) => setMode(e.target.value as ModeFilter)}>
              <option value="all">Все</option>
              <option value="prematch">Прематч</option>
              <option value="live">Лайв</option>
            </select>
          </label>
          <label>
            Статус
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="all">Все</option>
              <option value="pending">В ожидании</option>
              <option value="won">Выигрыш</option>
              <option value="lost">Проигрыш</option>
              <option value="refund">Возврат</option>
            </select>
          </label>
        </div>

        {loading ? <p className="muted">Загружаем ленту...</p> : null}
        {error ? <p className="error-msg">{error}</p> : null}
        {!loading && !error && items.length === 0 ? <p className="empty-state">По этим фильтрам в PIT BET пока нет сигналов.</p> : null}

        {groups.map(([title, predictions]) => (
          <div key={title} className="feed-group">
            <h3>{title}</h3>
            {predictions.map((item) => (
              <article key={item.id} className="prediction-card">
                <div className="prediction-top">
                  <strong>{item.match_name}</strong>
                  <span className={`access-pill ${item.access_level}`}>{accessLabel(item.access_level)}</span>
                </div>
                <div className="meta-row">
                  <span>{item.sport_type}</span>
                  <span>{item.league || "Без лиги"}</span>
                  <span>{formatKickoff(item.event_start_at)}</span>
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
                <p className="desc">{item.short_description || "Комментарий аналитика будет добавлен при обновлении сигнала."}</p>
                <div className="prediction-bottom">
                  <span className={`badge ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                  <span className="badge mode">{modeLabel(item.mode)}</span>
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>
    </Layout>
  );
}
