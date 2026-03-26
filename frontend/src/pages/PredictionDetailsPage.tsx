import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AccessBadge, AppShellSection, HeroCard, SectionHeader } from "../components/ui";
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
          eyebrow="PIT BET"
          title={item.match_name}
          description={item.league || (isRu ? "Лига уточняется" : "League is being updated")}
          right={<AccessBadge level={item.access_level} />}
        >
          <div className="cta-row">
            <span className={`badge ${item.status}`}>{statusLabel(item.status, language)}</span>
            <span className="badge info">{item.mode === "live" ? "Live" : isRu ? "Прематч" : "Prematch"}</span>
          </div>
        </HeroCard>
      ) : null}

      <AppShellSection>
        <SectionHeader title={isRu ? "Детали прогноза" : "Prediction details"} />

        {loading ? <p className="muted-line">{isRu ? "Загружаем данные..." : "Loading details..."}</p> : null}
        {!loading && error ? <p className="error-msg">{error}</p> : null}

        {!loading && item ? (
          <>
            <div className="stack-list">
              <div className="info-row">
                <span>{isRu ? "Вид спорта" : "Sport"}</span>
                <strong>{item.sport_type}</strong>
              </div>
              <div className="info-row">
                <span>{isRu ? "Старт" : "Kickoff"}</span>
                <strong>{dateLabel(item.event_start_at, language)}</strong>
              </div>
              <div className="info-row">
                <span>{isRu ? "Сигнал" : "Signal"}</span>
                <strong>{item.signal_type}</strong>
              </div>
              <div className="info-row">
                <span>{isRu ? "Коэффициент" : "Odds"}</span>
                <strong>{item.odds}</strong>
              </div>
              <div className="info-row">
                <span>{isRu ? "Риск" : "Risk"}</span>
                <strong>{item.risk_level}</strong>
              </div>
            </div>

            <SectionHeader title={isRu ? "Разбор" : "Analysis"} />
            <div className="details-body">
              {item.short_description ||
                (isRu
                  ? "Детальный комментарий будет опубликован вместе с обновлением сигнала."
                  : "Detailed commentary will appear once the signal is updated.")}
            </div>
          </>
        ) : null}

        <div className="cta-row">
          <Link className="btn secondary" to="/feed">
            {isRu ? "Назад к ленте" : "Back to feed"}
          </Link>
          <Link className="btn ghost" to="/tariffs">
            {isRu ? "Тарифы" : "Tariffs"}
          </Link>
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
