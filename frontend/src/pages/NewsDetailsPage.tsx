import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, SectionActions, SectionHeader } from "../components/ui";
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

export function NewsDetailsPage() {
  const { language } = useLanguage();
  const { newsId } = useParams<{ newsId: string }>();
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

  const post = useMemo(() => items.find((item) => item.id === newsId), [items, newsId]);

  return (
    <Layout>
      {post ? (
        <HeroCard
          eyebrow="PIT BET"
          title={post.title}
          description={post.category || (isRu ? "Новости" : "News")}
          right={<span className="badge info">{formatDate(post.published_at, language)}</span>}
        />
      ) : null}

      <AppShellSection>
        <SectionHeader title={isRu ? "Пост новости" : "News post"} />

        {loading ? <p className="muted-line">{isRu ? "Загрузка поста..." : "Loading post..."}</p> : null}
        {!loading && !post ? (
          <p className="empty-state">{isRu ? "Пост не найден или скрыт." : "Post not found or unpublished."}</p>
        ) : null}

        {post ? <article className="news-body-card">{post.body}</article> : null}

        <SectionActions compact>
          <Link className="btn secondary" to="/news">
            {isRu ? "Назад к новостям" : "Back to news"}
          </Link>
          <Link className="btn ghost" to="/">
            {isRu ? "На главную" : "Home"}
          </Link>
        </SectionActions>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
