import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, CTACluster, RocketLoader, SectionHeader, SkeletonBlock } from "../components/ui";
import { api, type NewsPost } from "../services/api";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

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
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    api
      .news()
      .then((list) => {
        if (!alive) return;
        setItems(list);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setItems([]);
        setError(parseErrorMessage(e, ""));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

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
        {loading ? (
          <>
            <RocketLoader title={t("news.article.loadingTitle")} subtitle={t("news.article.loadingSubtitle")} compact />
            <article className="pb-news-card pb-skeleton-card" aria-hidden="true">
              <SkeletonBlock className="w-45" />
              <SkeletonBlock className="w-96 h-110" />
              <SkeletonBlock className="w-34" />
            </article>
          </>
        ) : null}

        {!loading && error ? (
          <div className="pb-error-state">
            <p>{error || t("news.error")}</p>
            <CTACluster>
              <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
                {t("common.retry")}
              </button>
            </CTACluster>
          </div>
        ) : null}

        {!loading && !error && !post ? <p className="pb-empty-state">{t("news.article.empty")}</p> : null}
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
