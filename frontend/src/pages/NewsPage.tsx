import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, NewsPreviewCard, SectionHeader } from "../components/ui";
import { api, type NewsPost } from "../services/api";

function formatDate(value: string | null, language: "ru" | "en") {
  if (!value) return language === "ru" ? "Без даты" : "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "ru" ? "Без даты" : "No date";
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NewsPage() {
  const { language } = useLanguage();
  const isRu = language === "ru";

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
      <HeroCard
        eyebrow="PIT BET Newsroom"
        title={isRu ? "Продуктовые апдейты и рыночные события" : "Product updates and market events"}
        description={
          isRu
            ? "Ключевые обновления платформы, тарифов и сервисных изменений PIT BET."
            : "Key platform updates, tariff changes, and service-level updates from PIT BET."
        }
      />

      <AppShellSection>
        <SectionHeader title={isRu ? "Лента новостей" : "News stream"} subtitle={isRu ? "Официальные публикации" : "Official publications"} />

        {loading ? <p className="muted-line">{isRu ? "Загружаем новости..." : "Loading news..."}</p> : null}
        {!loading && items.length === 0 ? <p className="empty-state">{isRu ? "Пока нет публикаций." : "No posts yet."}</p> : null}

        <div className="news-list compact">
          {items.map((item) => (
            <NewsPreviewCard
              key={item.id}
              title={item.title}
              body={item.body}
              category={item.category}
              meta={formatDate(item.published_at, language)}
              to={`/news/${item.id}`}
              cta={isRu ? "Читать" : "Read"}
            />
          ))}
        </div>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
