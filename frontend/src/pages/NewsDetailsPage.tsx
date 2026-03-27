import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, HeroCard, SectionActions, SectionHeader } from "../components/ui";
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

export function NewsDetailsPage() {
  const { t, language } = useI18n();
  const { newsId } = useParams<{ newsId: string }>();

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
          description={post.category || t("layout.title.news")}
          right={<span className="badge info">{formatDate(post.published_at, language, t("common.noDate"))}</span>}
        />
      ) : null}

      <AppShellSection>
        <SectionHeader title={t("news.details.title")} />

        {loading ? <p className="muted-line">{t("news.details.loading")}</p> : null}
        {!loading && !post ? <p className="empty-state">{t("news.details.empty")}</p> : null}

        {post ? <article className="news-body-card">{post.body}</article> : null}

        <SectionActions compact>
          <Link className="btn secondary" to="/news">{t("news.details.back")}</Link>
          <Link className="btn ghost" to="/">{t("news.details.home")}</Link>
        </SectionActions>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
