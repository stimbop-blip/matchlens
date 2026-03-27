import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, CTACluster, SectionHeader } from "../components/ui";
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
        <section className="pb-hero-panel pb-reveal">
          <span className="pb-eyebrow">PIT BET</span>
          <h2>{post.title}</h2>
          <p>{post.category || t("layout.title.news")}</p>
          <div className="pb-meta-line">
            <span>{formatDate(post.published_at, language, t("common.noDate"))}</span>
          </div>
        </section>
      ) : null}

      <AppShellSection>
        <SectionHeader title={t("news.article.title")} />
        {loading ? <p className="pb-empty-state">{t("news.article.loading")}</p> : null}
        {!loading && !post ? <p className="pb-empty-state">{t("news.article.empty")}</p> : null}
        {post ? <article className="pb-article-text long">{post.body}</article> : null}

        <CTACluster>
          <Link className="pb-btn pb-btn-secondary" to="/news">
            {t("news.article.back")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/">
            {t("news.article.home")}
          </Link>
        </CTACluster>
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
