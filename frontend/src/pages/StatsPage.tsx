import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, SectionActions, SectionHeader, Sparkline, StatCard } from "../components/ui";
import { api, type PublicStats } from "../services/api";

export function StatsPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .stats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <HeroCard
        eyebrow="PIT BET"
        title={isRu ? "Результаты и структура сигналов" : "Results and signal structure"}
        description={
          isRu
            ? "Фактические показатели PIT BET: объем, точность, ROI и текущая динамика."
            : "Actual PIT BET metrics: volume, hit rate, ROI, and current momentum."
        }
      >
        <div className="market-ribbon stats-ribbon">
          <span>{isRu ? "Performance pulse" : "Performance pulse"}</span>
          <Sparkline values={[60, 54, 58, 49, 44, 52, 47, 38, 41, 33]} />
          <span className="live-pulse">ROI</span>
        </div>
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Прогнозов" : "Predictions"} value={stats?.total ?? 0} tone="accent" />
          <StatCard label={isRu ? "Точность" : "Hit rate"} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
          <StatCard label="ROI" value={`${stats?.roi ?? 0}%`} tone="warning" />
          <StatCard label={isRu ? "В ожидании" : "Pending"} value={stats?.pending ?? 0} />
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Ключевые результаты" : "Key outcomes"}
          subtitle={isRu ? "Распределение завершенных сигналов" : "Completed signal distribution"}
        />

        {loading ? <p className="muted-line">{isRu ? "Обновляем показатели..." : "Refreshing metrics..."}</p> : null}
        {!loading && !stats ? (
          <div className="empty-block subtle">
            <p className="empty-state">{isRu ? "Не удалось загрузить статистику." : "Failed to load statistics."}</p>
            <p className="muted-line">{isRu ? "Проверьте подключение и попробуйте снова." : "Check your connection and try again."}</p>
          </div>
        ) : null}

        {stats ? (
          <>
            <div className="stat-grid compact">
              <StatCard label={isRu ? "Выигрыши" : "Wins"} value={stats.wins} tone="success" />
              <StatCard label={isRu ? "Поражения" : "Loses"} value={stats.loses} tone="warning" />
              <StatCard label={isRu ? "Возвраты" : "Refunds"} value={stats.refunds} />
              <StatCard label={isRu ? "Всего" : "Total"} value={stats.total} tone="accent" />
            </div>

            <div className="stats-structure-block">
              <SectionHeader
                title={isRu ? "Структура по доступу" : "Access structure"}
                subtitle={isRu ? "Free / Premium / VIP" : "Free / Premium / VIP"}
              />
              <div className="stat-grid compact">
                <StatCard label="Free" value={stats.by_access?.free ?? 0} />
                <StatCard label="Premium" value={stats.by_access?.premium ?? 0} tone="accent" />
                <StatCard label="VIP" value={stats.by_access?.vip ?? 0} tone="warning" />
              </div>
            </div>

            <div className="insight-card">
              <strong>{isRu ? "Performance insight" : "Performance insight"}</strong>
              <p>
                {isRu
                  ? "Сигналы PIT BET показывают текущую структуру результативности по уровням доступа. Используйте ROI и hit rate как навигатор дисциплины, а не как обещание результата."
                  : "PIT BET signal performance reflects current access-level structure. Use ROI and hit rate as discipline indicators, not guaranteed outcomes."}
              </p>
            </div>

            <SectionActions compact>
              <Link className="btn secondary" to="/feed">{isRu ? "Открыть ленту" : "Open feed"}</Link>
              <Link className="btn ghost" to="/tariffs">{isRu ? "Смотреть тарифы" : "View tariffs"}</Link>
            </SectionActions>
          </>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
