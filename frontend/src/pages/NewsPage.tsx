import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, MarketPulse, NewsRibbon, SectionHeader } from "../components/ui";
import { api, type NewsPost } from "../services/api";

function formatDate(value: string | null, language: "ru" | "en", fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NewsPage() {
  const { t, language } = useI18n();

  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .news()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <span className="pb-eyebrow">PIT BET</span>
        <h2>{t("news.hero.title")}</h2>
        <p>{t("news.hero.subtitle")}</p>
        <MarketPulse label={t("news.stream.title")} values={[52, 48, 58, 54, 62, 57, 65, 61, 68, 70]} tag={t("common.live")} />
      </section>

      <AppShellSection>
        <SectionHeader title={t("news.stream.title")} subtitle={t("news.stream.subtitle")} />

        {loading ? <p className="pb-empty-state">{t("news.loading")}</p> : null}
        {!loading && items.length === 0 ? <p className="pb-empty-state">{t("news.empty")}</p> : null}

        {items.length > 0 ? (
          <div className="pb-news-grid">
            {items.map((item) => (
              <NewsRibbon
                key={item.id}
                title={item.title}
                body={item.body}
                category={item.category}
                meta={formatDate(item.published_at, language, t("common.noDate"))}
                to={`/news/${item.id}`}
              />
            ))}
          </div>
        ) : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
