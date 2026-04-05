import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { HeroPanel } from "../components/premium/HeroPanel";
import { PremiumKpi } from "../components/premium/PremiumKpi";
import { AIScanningLoader } from "../components/ui/AIScanningLoader";
import { SkeletonBlock, Sparkline } from "../components/ui";
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

function previewText(value: string, maxLength = 180): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
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

  const visibleItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.is_published)
        .sort((a, b) => {
          const left = new Date(a.published_at || 0).getTime() || 0;
          const right = new Date(b.published_at || 0).getTime() || 0;
          return right - left;
        }),
    [items],
  );

  const pulseValues = useMemo(() => {
    const base = 52 + Math.min(14, visibleItems.length);
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => base + idx + (idx % 2 === 0 ? 2 : -1));
  }, [visibleItems.length]);

  const latestPublished = visibleItems[0]?.published_at || null;
  const latestDate = formatDate(latestPublished, language, t("common.noDate"));
  const latestCategory = visibleItems[0]?.category || t("layout.title.news");
  const categoryLabel = t("news.kpi.category");

  return (
    <Layout>
      <HeroPanel eyebrow="PIT BET" title={t("news.hero.title")} subtitle={t("news.hero.subtitle")} right={<span className="pb-feed-v4-total">{visibleItems.length}</span>}>
        <div className="pb-overview-market-shell">
          <div className="pb-overview-market-head">
            <span>{t("news.stream.title")}</span>
            <span className="pb-overview-live-tag">{t("common.live")}</span>
          </div>
          <Sparkline values={pulseValues} className="pb-overview-sparkline" />
        </div>

        <div className="pb-news-v4-kpi">
          <PremiumKpi label={t("news.stream.title")} value={visibleItems.length} tone="accent" />
          <PremiumKpi label={t("layout.title.news")} value={latestDate} />
          <PremiumKpi label={categoryLabel} value={latestCategory} tone="vip" />
        </div>
      </HeroPanel>

      <section className="pb-premium-panel pb-reveal">
        <div className="pb-premium-head">
          <h3>{t("news.stream.title")}</h3>
          <small>{t("news.stream.subtitle")}</small>
        </div>

        {loading ? (
          <>
            <AIScanningLoader compact />
            <div className="pb-overview-news-skeleton" aria-hidden="true">
              <SkeletonBlock className="h-84" />
              <SkeletonBlock className="h-84" />
              <SkeletonBlock className="h-84" />
            </div>
          </>
        ) : null}

        {!loading && error ? (
          <div className="pb-error-state">
            <p>{error || t("news.error")}</p>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
              {t("common.retry")}
            </button>
          </div>
        ) : null}

        {!loading && !error && visibleItems.length === 0 ? <p className="pb-empty-state">{t("news.empty")}</p> : null}

        {!loading && !error && visibleItems.length > 0 ? (
          <div className="pb-overview-news-list">
            {visibleItems.map((item) => (
              <Link key={item.id} className="pb-overview-news-item" to={`/news/${item.id}`}>
                <div className="pb-news-v4-row">
                  <h4>{item.title}</h4>
                  <span className="pb-news-v4-chip">{item.category || t("layout.title.news")}</span>
                </div>
                <p>{previewText(item.body, 180)}</p>
                <small>{formatDate(item.published_at, language, t("common.noDate"))}</small>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="pb-news-v4-actions">
          <Link className="pb-btn pb-btn-secondary" to="/">
            {t("news.article.home")}
          </Link>
          <Link className="pb-btn pb-btn-ghost" to="/menu">
            {t("layout.nav.center")}
          </Link>
        </div>
      </section>

      <AppDisclaimer />
    </Layout>
  );
}
