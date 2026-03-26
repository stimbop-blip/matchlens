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
        title={isRu ? "Статистика и прозрачность" : "Statistics and transparency"}
        description={
          isRu
            ? "Метрики считаются по фактическим результатам и показывают реальную динамику продукта."
            : "Metrics are calculated by actual outcomes and show real product performance."
        }
      >
        <div className="stat-grid compact">
          <StatCard label={isRu ? "Прогнозов" : "Predictions"} value={stats?.total ?? 0} tone="accent" />
          <StatCard label={isRu ? "Точность" : "Hit rate"} value={`${stats?.hit_rate ?? 0}%`} tone="success" />
          <StatCard label="ROI" value={`${stats?.roi ?? 0}%`} tone="warning" />
        </div>
      </HeroCard>

      <AppShellSection>
        <SectionHeader
          title={isRu ? "Ключевые показатели" : "Core metrics"}
          subtitle={isRu ? "Общий срез по результатам" : "Overall outcome summary"}
        />

        {loading ? <p className="muted-line">{isRu ? "Обновляем показатели..." : "Refreshing metrics..."}</p> : null}
        {!loading && !stats ? <p className="empty-state">{isRu ? "Не удалось загрузить статистику." : "Failed to load statistics."}</p> : null}

        {stats ? (
          <>
            <div className="stat-grid">
              <StatCard label={isRu ? "Выигрыши" : "Wins"} value={stats.wins} tone="success" />
              <StatCard label={isRu ? "Поражения" : "Loses"} value={stats.loses} tone="warning" />
              <StatCard label={isRu ? "Возвраты" : "Refunds"} value={stats.refunds} />
              <StatCard label={isRu ? "В ожидании" : "Pending"} value={stats.pending} />
            </div>

            <SectionHeader
              title={isRu ? "Распределение по доступу" : "Distribution by access"}
              subtitle={isRu ? "Free / Premium / VIP" : "Free / Premium / VIP"}
            />
            <div className="stat-grid compact">
              <StatCard label="Free" value={stats.by_access.free ?? 0} />
              <StatCard label="Premium" value={stats.by_access.premium ?? 0} tone="accent" />
              <StatCard label="VIP" value={stats.by_access.vip ?? 0} tone="warning" />
            </div>
          </>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
