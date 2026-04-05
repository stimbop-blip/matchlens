import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
import { SkeletonBlock } from "../components/ui";
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

  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const left = new Date(a.published_at || 0).getTime() || 0;
        const right = new Date(b.published_at || 0).getTime() || 0;
        return right - left;
      }),
    [items],
  );

  const post = useMemo(() => orderedItems.find((item) => item.id === newsId), [orderedItems, newsId]);
  const related = useMemo(() => orderedItems.filter((item) => item.id !== newsId).slice(0, 3), [orderedItems, newsId]);

  const wordsCount = useMemo(() => {
    if (!post) return 0;
    return post.body.trim().split(/\s+/).filter(Boolean).length;
  }, [post]);

  const readMinutes = Math.max(1, Math.round(wordsCount / 190));
  const wordsLabel = t("news.article.words");
  const readLabel = t("news.article.readTime");
  const readValue = `${readMinutes} ${t("news.article.minutes")}`;
  const relatedTitle = t("news.article.related");

  return (
    <Layout>
      {loading ? (
        <section className="pb-premium-panel pb-reveal">
          <AIScanningLoader compact />
          <div className="pb-overview-kpi-skeleton" aria-hidden="true">
            <SkeletonBlock className="h-96" />
            <SkeletonBlock className="h-110" />
            <SkeletonBlock className="h-74" />
          </div>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="pb-premium-panel pb-reveal">
          <div className="pb-error-state">
            <p>{error || t("news.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && !error && !post ? (
        <section className="pb-premium-panel pb-reveal">
          <p className="pb-empty-state">{t("news.article.empty")}</p>
          <div className="pb-news-v4-actions">
            <Link className="pb-btn pb-btn-secondary" to="/news">
              {t("news.article.back")}
            </Link>
            <Link className="pb-btn pb-btn-ghost" to="/">
              {t("news.article.home")}
            </Link>
          </div>
        </section>
      ) : null}

      {!loading && post ? (
        <>
          <HeroPanel
            eyebrow="PIT BET"
            title={post.title}
            subtitle={post.category || t("layout.title.news")}
            right={<span className="pb-news-v4-chip">{post.category || t("layout.title.news")}</span>}
          >
            <div className="pb-news-v4-kpi">
              <PremiumKpi label={t("layout.title.news")} value={formatDate(post.published_at, language, t("common.noDate"))} />
              <PremiumKpi label={wordsLabel} value={wordsCount} tone="accent" />
              <PremiumKpi label={readLabel} value={readValue} tone="vip" />
            </div>
          </HeroPanel>

          <section className="pb-premium-panel pb-reveal">
            <div className="pb-premium-head">
              <h3>{t("news.article.title")}</h3>
            </div>
            <article className="pb-news-v4-article">{post.body}</article>
          </section>

          {related.length > 0 ? (
            <section className="pb-premium-panel pb-reveal">
              <div className="pb-premium-head">
                <h3>{relatedTitle}</h3>
                <small>{t("news.stream.subtitle")}</small>
              </div>

              <div className="pb-overview-news-list">
                {related.map((item) => (
                  <Link key={item.id} className="pb-overview-news-item" to={`/news/${item.id}`}>
                    <div className="pb-news-v4-row">
                      <h4>{item.title}</h4>
                      <span className="pb-news-v4-chip">{item.category || t("layout.title.news")}</span>
                    </div>
                    <small>{formatDate(item.published_at, language, t("common.noDate"))}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="pb-premium-panel pb-reveal">
            <div className="pb-news-v4-actions">
              <Link className="pb-btn pb-btn-secondary" to="/news">
                {t("news.article.back")}
              </Link>
              <Link className="pb-btn pb-btn-ghost" to="/">
                {t("news.article.home")}
              </Link>
            </div>
          </section>
        </>
      ) : null}

      <AppDisclaimer />
    </Layout>
  );
}
