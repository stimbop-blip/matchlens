import { useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { AppShellSection, CTACluster, MarketPulse, NewsRibbon, RocketLoader, SectionHeader, SkeletonBlock } from "../components/ui";
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

export function NewsPage() {
  const { t, language } = useI18n();

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

        {loading ? (
          <>
            <RocketLoader title={t("news.loadingTitle")} subtitle={t("news.loadingSubtitle")} compact />
            <div className="pb-news-grid" aria-hidden="true">
              <article className="pb-news-card pb-skeleton-card">
                <SkeletonBlock className="w-48" />
                <SkeletonBlock className="w-95 h-62" />
                <SkeletonBlock className="w-30" />
              </article>
              <article className="pb-news-card pb-skeleton-card">
                <SkeletonBlock className="w-55" />
                <SkeletonBlock className="w-90 h-62" />
                <SkeletonBlock className="w-36" />
              </article>
            </div>
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

        {!loading && !error && items.length === 0 ? <p className="pb-empty-state">{t("news.empty")}</p> : null}

        {!loading && !error && items.length > 0 ? (
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
