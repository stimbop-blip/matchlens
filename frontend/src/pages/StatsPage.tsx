import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, SectionHeader, StatCard } from "../components/ui";
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
        title={isRu ? "Статистика и результативность" : "Performance dashboard"}
        description={
          isRu
            ? "Дашборд показывает фактические показатели PIT BET: объем, точность, ROI и структуру результатов."
            : "Dashboard shows PIT BET performance: volume, hit rate, ROI, and outcomes breakdown."
        }
      >
        <div className="stat-grid">
          <StatCard label={isRu ? "Прогнозов" : "Predictions"} value={stats?.total ?? 0} tone="accent" />
          <StatCard label={isRu ? "Точность" : "Hit rate"} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
          <StatCard label="ROI" value={`${stats?.roi ?? 0}%`} tone="warning" />
          <StatCard label={isRu ? "В ожидании" : "Pending"} value={stats?.pending ?? 0} />
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Ключевые KPI" : "Core KPI"}
          subtitle={isRu ? "Срез по фактическим исходам" : "Snapshot of actual outcomes"}
        />

        {loading ? <p className="muted-line">{isRu ? "Обновляем показатели..." : "Refreshing metrics..."}</p> : null}
        {!loading && !stats ? (
          <div className="empty-block">
            <p className="empty-state">{isRu ? "Не удалось загрузить статистику." : "Failed to load statistics."}</p>
            <p className="muted-line">{isRu ? "Проверьте подключение и повторите попытку позже." : "Check connection and try again later."}</p>
          </div>
        ) : null}

        {stats ? (
          <>
            <div className="stat-grid compact">
              <StatCard label={isRu ? "Выигрыши" : "Wins"} value={stats.wins} tone="success" />
              <StatCard label={isRu ? "Поражения" : "Loses"} value={stats.loses} tone="warning" />
              <StatCard label={isRu ? "Возвраты" : "Refunds"} value={stats.refunds} />
              <StatCard label={isRu ? "Прогнозов всего" : "Total predictions"} value={stats.total} tone="accent" />
            </div>

            <SectionHeader
              title={isRu ? "Разбивка по доступу" : "Access breakdown"}
              subtitle={isRu ? "Структура Free / Premium / VIP" : "Free / Premium / VIP structure"}
            />
            <div className="stat-grid">
              <StatCard label="Free" value={stats.by_access?.free ?? 0} />
              <StatCard label="Premium" value={stats.by_access?.premium ?? 0} tone="accent" />
              <StatCard label="VIP" value={stats.by_access?.vip ?? 0} tone="warning" />
              <StatCard label={isRu ? "ROI" : "ROI"} value={`${stats.roi}%`} tone="success" />
            </div>
          </>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
