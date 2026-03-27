import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, NewsPreviewCard, SectionHeader } from "../components/ui";
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
      <HeroCard eyebrow="PIT BET" title={t("news.hero.title")} description={t("news.hero.subtitle")} />

      <AppShellSection>
        <SectionHeader title={t("news.stream.title")} subtitle={t("news.stream.subtitle")} />

        {loading ? <p className="muted-line">{t("news.loading")}</p> : null}
        {!loading && items.length === 0 ? <p className="empty-state">{t("news.empty")}</p> : null}

        <div className="news-list compact">
          {items.map((item) => (
            <NewsPreviewCard
              key={item.id}
              title={item.title}
              body={item.body}
              category={item.category}
              meta={formatDate(item.published_at, language, t("common.noDate"))}
              to={`/news/${item.id}`}
              cta={t("news.read")}
            />
          ))}
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
