import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionActions, SectionHeader } from "../components/ui";
import { api, type Prediction } from "../services/api";

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

function statusLabel(status: Prediction["status"], language: "ru" | "en") {
  if (status === "won") return language === "ru" ? "Выигрыш" : "Won";
  if (status === "lost") return language === "ru" ? "Проигрыш" : "Lost";
  if (status === "refund") return language === "ru" ? "Возврат" : "Refund";
  return language === "ru" ? "В ожидании" : "Pending";
}

function signalMark(item: Prediction, language: "ru" | "en") {
  if (item.mode === "live") return "Live";
  if (item.access_level === "vip") return language === "ru" ? "Strong Setup" : "Strong Setup";
  return language === "ru" ? "Prematch" : "Prematch";
}

export function PredictionDetailsPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const { predictionId } = useParams<{ predictionId: string }>();

  const [item, setItem] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!predictionId) {
      setError(isRu ? "Прогноз не найден." : "Prediction not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    api
      .prediction(predictionId)
      .then(setItem)
      .catch((e: Error) => setError(e.message || (isRu ? "Не удалось загрузить прогноз." : "Failed to load prediction.")))
      .finally(() => setLoading(false));
  }, [isRu, predictionId]);

  return (
    <Layout>
      {item ? (
        <HeroCard
          eyebrow="PIT BET Signal"
          title={item.match_name}
          description={item.league || (isRu ? "Лига уточняется" : "League pending")}
          right={<AccessBadge level={item.access_level} />}
        >
          <div className="feed-meta-row top">
            <span className="badge info">{signalMark(item, language)}</span>
            <span className={`badge ${item.status}`}>{statusLabel(item.status, language)}</span>
            <span className="mark-pill">{item.mode === "live" ? "Live" : "Prematch"}</span>
          </div>
        </HeroCard>
      ) : null}

      <AppShellSection>
        <SectionHeader title={isRu ? "Signal breakdown" : "Signal breakdown"} />

        {loading ? <p className="muted-line">{isRu ? "Загружаем данные..." : "Loading details..."}</p> : null}
        {!loading && error ? <p className="error-msg">{error}</p> : null}

        {!loading && item ? (
          <>
            <div className="details-grid">
              <div className="info-row"><span>{isRu ? "Вид спорта" : "Sport"}</span><strong>{item.sport_type}</strong></div>
              <div className="info-row"><span>{isRu ? "Старт" : "Kickoff"}</span><strong>{dateLabel(item.event_start_at, language)}</strong></div>
              <div className="info-row"><span>{isRu ? "Сигнал" : "Signal"}</span><strong>{item.signal_type}</strong></div>
              <div className="info-row"><span>{isRu ? "Коэффициент" : "Odds"}</span><strong>{item.odds}</strong></div>
              <div className="info-row"><span>{isRu ? "Риск" : "Risk"}</span><strong>{item.risk_level}</strong></div>
              <div className="info-row"><span>{isRu ? "Доступ" : "Access"}</span><strong>{item.access_level.toUpperCase()}</strong></div>
            </div>

            <SectionHeader title={isRu ? "Контекст сигнала" : "Signal context"} />
            <div className="details-body">
              {isRu
                ? `Режим: ${item.mode === "live" ? "Live" : "Prematch"}. Структура сигнала формируется на основе рыночного движения и игрового контекста.`
                : `Mode: ${item.mode === "live" ? "Live" : "Prematch"}. Signal structure is based on market movement and game context.`}
            </div>

            <SectionHeader title={isRu ? "Аналитический комментарий" : "Analyst commentary"} />
            <div className="details-body">
              {item.short_description ||
                (isRu
                  ? "Подробный аналитический комментарий будет опубликован вместе с обновлением сигнала."
                  : "Detailed analyst commentary will be available after signal update.")}
            </div>
          </>
        ) : null}

        <SectionActions compact>
          <Link className="btn secondary" to="/feed">{isRu ? "Назад к ленте" : "Back to feed"}</Link>
          <Link className="btn ghost" to="/tariffs">{isRu ? "Смотреть тарифы" : "View tariffs"}</Link>
        </SectionActions>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
