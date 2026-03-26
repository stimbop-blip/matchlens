import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { api, type Prediction } from "../services/api";

type ModeFilter = "all" | "prematch" | "live";
type StatusFilter = "all" | "pending" | "won" | "lost" | "refund";

function statusLabel(status: Prediction["status"], language: "ru" | "en"): string {
  if (status === "won") return language === "ru" ? "Выигрыш" : "Won";
  if (status === "lost") return language === "ru" ? "Проигрыш" : "Lost";
  if (status === "refund") return language === "ru" ? "Возврат" : "Refund";
  return language === "ru" ? "В ожидании" : "Pending";
}

function statusClass(status: Prediction["status"]): string {
  if (status === "won") return "won";
  if (status === "lost") return "lost";
  if (status === "refund") return "refund";
  return "pending";
}

function modeLabel(mode: Prediction["mode"], language: "ru" | "en"): string {
  if (mode === "live") return "Live";
  return language === "ru" ? "Прематч" : "Prematch";
}

function accessLabel(access: Prediction["access_level"], language: "ru" | "en"): string {
  if (access === "premium") return "Premium";
  if (access === "vip") return "VIP";
  return language === "ru" ? "Бесплатный" : "Free";
}

function formatKickoff(value: string, language: "ru" | "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayHeading(date: Date, language: "ru" | "en"): string {
  const now = new Date();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000);
  if (diffDays === 0) return language === "ru" ? "Сегодня" : "Today";
  if (diffDays === 1) return language === "ru" ? "Завтра" : "Tomorrow";
  if (diffDays === -1) return language === "ru" ? "Вчера" : "Yesterday";
  return target.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

export function FeedPage() {
  const { language } = useLanguage();
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
      .catch((e: Error) => setError(e.message || (language === "ru" ? "Не удалось загрузить прогнозы" : "Failed to load signals")))
      .finally(() => setLoading(false));
  }, [mode, status, language]);

  const groups = useMemo(() => {
    const map = new Map<string, Prediction[]>();
    items.forEach((item) => {
      const date = new Date(item.event_start_at);
      const key = dayHeading(date, language);
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    });
    return Array.from(map.entries());
  }, [items, language]);

  const isRu = language === "ru";

  return (
    <Layout>
      <section className="card">
        <div className="section-head">
          <h2>{isRu ? "Лента сигналов" : "Signals feed"}</h2>
          <span className="muted">{items.length} PIT BET</span>
        </div>
        <p className="stacked">
          {isRu
            ? "Прематч и live-сигналы с фильтрами, риском и краткой аналитикой по каждой позиции."
            : "Prematch and live signals with filters, risk tags, and short analytics for each position."}
        </p>

        <div className="filter-row">
          <label>
            {isRu ? "Формат" : "Mode"}
            <select value={mode} onChange={(e) => setMode(e.target.value as ModeFilter)}>
              <option value="all">{isRu ? "Все" : "All"}</option>
              <option value="prematch">{isRu ? "Прематч" : "Prematch"}</option>
              <option value="live">Live</option>
            </select>
          </label>
          <label>
            {isRu ? "Статус" : "Status"}
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="all">{isRu ? "Все" : "All"}</option>
              <option value="pending">{isRu ? "В ожидании" : "Pending"}</option>
              <option value="won">{isRu ? "Выигрыш" : "Won"}</option>
              <option value="lost">{isRu ? "Проигрыш" : "Lost"}</option>
              <option value="refund">{isRu ? "Возврат" : "Refund"}</option>
            </select>
          </label>
        </div>

        {loading ? <p className="muted">{isRu ? "Загружаем ленту..." : "Loading feed..."}</p> : null}
        {error ? <p className="error-msg">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="empty-state">{isRu ? "По этим фильтрам пока нет сигналов." : "No signals for current filters."}</p>
        ) : null}

        {groups.map(([title, predictions]) => (
          <div key={title} className="feed-group">
            <h3>{title}</h3>
            {predictions.map((item) => (
              <article key={item.id} className="prediction-card feed-card-clean">
                <div className="prediction-top">
                  <strong>{item.match_name}</strong>
                  <span className={`access-pill ${item.access_level}`}>{accessLabel(item.access_level, language)}</span>
                </div>
                <div className="meta-row">
                  <span>{item.sport_type}</span>
                  <span>{item.league || (isRu ? "Без лиги" : "No league")}</span>
                  <span>{formatKickoff(item.event_start_at, language)}</span>
                </div>
                <div className="signal-row">
                  <div>
                    <small>{isRu ? "Сигнал" : "Signal"}</small>
                    <p>{item.signal_type}</p>
                  </div>
                  <div>
                    <small>{isRu ? "Коэффициент" : "Odds"}</small>
                    <p>{item.odds}</p>
                  </div>
                  <div>
                    <small>{isRu ? "Риск" : "Risk"}</small>
                    <p>{item.risk_level}</p>
                  </div>
                </div>
                <p className="desc">
                  {item.short_description ||
                    (isRu
                      ? "Комментарий аналитика будет добавлен при обновлении сигнала."
                      : "Analyst note will appear when the signal is updated.")}
                </p>
                <div className="prediction-bottom">
                  <span className={`badge ${statusClass(item.status)}`}>{statusLabel(item.status, language)}</span>
                  <span className="badge mode">{modeLabel(item.mode, language)}</span>
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>
      <AppDisclaimer />
    </Layout>
  );
}
