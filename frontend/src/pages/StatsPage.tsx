import { Layout } from "../components/Layout";
import { useEffect, useState } from "react";

import { api } from "../services/api";

export function StatsPage() {
  const [stats, setStats] = useState<{ total: number; winrate: number; roi: number } | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <Layout>
      <section className="card">
        <h2>Статистика</h2>
        {!stats ? (
          <p>Данные недоступны.</p>
        ) : (
          <p>
            Прогнозов: {stats.total} • Winrate: {stats.winrate}% • ROI: {stats.roi}%
          </p>
        )}
      </section>
    </Layout>
  );
}
