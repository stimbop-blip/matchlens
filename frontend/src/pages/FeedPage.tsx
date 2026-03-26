import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, SectionHeader, SegmentedTabs } from "../components/ui";
import { api, type Prediction } from "../services/api";

type ModeFilter = "all" | "prematch" | "live";
type StatusFilter = "all" | "pending" | "won" | "lost" | "refund";

function statusLabel(status: Prediction["status"], language: "ru" | "en"): string {
  if (status === "won") return language === "ru" ? "Выигрыш" : "Won";
  if (status === "lost") return language === "ru" ? "Проигрыш" : "Lost";
  if (status === "refund") return language === "ru" ? "Возврат" : "Refund";
  return language === "ru" ? "В ожидании" : "Pending";
}

function modeLabel(mode: Prediction["mode"], language: "ru" | "en"): string {
  if (mode === "live") return "Live";
  return language === "ru" ? "Прематч" : "Prematch";
}

function dateLabel(value: string, language: "ru" | "en") {
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

function teaser(value: string | null | undefined, language: "ru" | "en"): string {
  const source = (value || "").trim();
  if (!source) {
    return language === "ru"
      ? "Комментарий аналитика появится после обновления сигнала."
      : "Analyst comment appears once the signal is updated.";
  }
  if (source.length <= 160) return source;
  return `${source.slice(0, 157).trim()}...`;
}

export function FeedPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

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
      .catch((e: Error) => setError(e.message || (isRu ? "Не удалось загрузить прогнозы" : "Failed to load signals")))
      .finally(() => setLoading(false));
  }, [isRu, mode, status]);

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

  const modeOptions = [
    { value: "all", label: isRu ? "Все" : "All" },
    { value: "prematch", label: isRu ? "Прематч" : "Prematch" },
    { value: "live", label: "Live" },
  ];

  const statusOptions = [
    { value: "all", label: isRu ? "Все" : "All" },
    { value: "pending", label: isRu ? "В ожидании" : "Pending" },
    { value: "won", label: isRu ? "Выигрыш" : "Won" },
    { value: "lost", label: isRu ? "Проигрыш" : "Lost" },
    { value: "refund", label: isRu ? "Возврат" : "Refund" },
  ];

  return (
    <Layout>
      <AppShellSection>
        <SectionHeader
          title={isRu ? "Лента сигналов" : "Signals feed"}
          subtitle={
            isRu
              ? "Прематч и live-сигналы с фильтрацией по статусу"
              : "Prematch and live signals with clean status filtering"
          }
          action={<span className="hint-chip">{items.length}</span>}
        />

        <div className="filter-stack">
          <SegmentedTabs value={mode} options={modeOptions} onChange={(next) => setMode(next as ModeFilter)} />
          <SegmentedTabs value={status} options={statusOptions} onChange={(next) => setStatus(next as StatusFilter)} />
        </div>

        {loading ? <p className="muted-line">{isRu ? "Загружаем ленту..." : "Loading feed..."}</p> : null}
        {error ? <p className="error-msg">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="empty-state">{isRu ? "По этим фильтрам сигналов нет." : "No signals for current filters."}</p>
        ) : null}

        <div className="feed-list">
          {groups.map(([title, predictions]) => (
            <section key={title} className="feed-day-block">
              <h3 className="feed-day-title">{title}</h3>
              <div className="feed-cards">
                {predictions.map((item) => (
                  <article key={item.id} className="feed-card">
                    <div className="feed-card-head">
                      <div>
                        <strong>{item.match_name}</strong>
                        <p>{item.league || (isRu ? "Без лиги" : "No league")}</p>
                      </div>
                      <AccessBadge level={item.access_level} />
                    </div>

                    <div className="feed-meta-row">
                      <span>{item.sport_type}</span>
                      <span>{modeLabel(item.mode, language)}</span>
                      <span>{dateLabel(item.event_start_at, language)}</span>
                    </div>

                    <div className="feed-signal-grid">
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

                    <p className="feed-note">
                      {teaser(item.short_description, language)}
                    </p>

                    <div className="feed-footer">
                      <span className={`badge ${item.status}`}>{statusLabel(item.status, language)}</span>
                      <Link className="feed-open-link" to={`/feed/${item.id}`}>
                        {isRu ? "Подробнее" : "Details"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
