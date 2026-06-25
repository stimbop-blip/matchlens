import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { Layout } from "../components/Layout";
import { NewsEditor } from "../components/NewsEditor";
import { api, type NewsPost } from "../services/api";

type Tab = "all" | "pit" | "bets";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function formatDate(value: string | null, language: "ru" | "en", fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  });
}

function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 190));
}

function categoryKey(category: string): "pit" | "bets" {
  return category === "bets" ? "bets" : "pit";
}

export function NewsPage() {
  const { t, language } = useI18n();

  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStaff, setIsStaff] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // ГЛАВНОЕ: НЕ зависим от `t` (она пересоздаётся каждый рендер → бесконечный цикл).
  // Сообщение ошибки формируем в catch через ref, а не в зависимостях колбэка.
  const errorFallback = useRef(t("news.error"));
  errorFallback.current = t("news.error");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api
      .news(tab)
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setItems([]);
        setError(parseErrorMessage(e, errorFallback.current));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tab, reloadKey]);

  useEffect(() => {
    api
      .me()
      .then((me) => setIsStaff(Boolean(me.role === "admin" || me.role === "support" || me.is_admin || me.is_support)))
      .catch(() => undefined);
  }, []);

  // после создания/редактирования — переключаемся на «Все» и перечитываем
  const handleSaved = () => {
    setTab("all");
    setReloadKey((p) => p + 1);
  };

  const ordered = useMemo(
    () =>
      [...items].sort((a, b) => {
        const left = new Date(a.published_at || 0).getTime() || 0;
        const right = new Date(b.published_at || 0).getTime() || 0;
        return right - left;
      }),
    [items],
  );

  const tabs: Tab[] = ["all", "pit", "bets"];

  return (
    <Layout>
      {/* Переключатель вкладок */}
      <div className="pb-news-tabs" role="tablist">
        {tabs.map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            className={`pb-news-tab ${tab === value ? "active" : ""}`}
            onClick={() => setTab(value)}
          >
            {t(`news.tab.${value}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="pb-news-list2" aria-hidden="true">
          <div className="pb-news-featured pb-news-skeleton">
            <div className="pb-news-featured-cover pb-news-card2-cover fallback" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="pb-news-row pb-news-skeleton">
              <div className="pb-news-row-thumb pb-news-card2-cover fallback" />
              <div className="pb-news-row-body">
                <span className="pb-news-skel-line pb-news-skel-title" />
                <span className="pb-news-skel-line pb-news-skel-text" />
                <span className="pb-news-skel-line pb-news-skel-meta" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="pb-error-state">
          <p>{error}</p>
          <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((p) => p + 1)}>
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      {!loading && !error && ordered.length === 0 ? (
        <p className="pb-empty-state">{t("news.empty")}</p>
      ) : null}

      {!loading && !error && ordered.length > 0 ? (
        <div className="pb-news-list2">
          {ordered.map((item, idx) => {
            const cat = categoryKey(item.category);
            const isFeatured = idx === 0;
            if (isFeatured) {
              return (
                <Link key={item.id} className="pb-news-featured" to={`/news/${item.id}`}>
                  <div className={`pb-news-featured-cover ${item.cover_url ? "" : "fallback"}`}>
                    {item.cover_url ? <img src={item.cover_url} alt="" loading="lazy" /> : null}
                    <div className="pb-news-featured-overlay" />
                    <span className={`pb-news-featured-badge ${cat}`}>{t(`news.cat.${cat}`)}</span>
                  </div>
                  <div className="pb-news-featured-body">
                    <h3 className="pb-news-featured-title">{item.title}</h3>
                    {item.summary ? <p className="pb-news-featured-summary">{item.summary}</p> : null}
                    <div className="pb-news-featured-meta">
                      <span>{formatDate(item.published_at, language, t("common.noDate"))}</span>
                      <span className="dot" />
                      <span>{t("news.minRead", { min: readMinutes(item.body) })}</span>
                    </div>
                  </div>
                </Link>
              );
            }
            return (
              <Link key={item.id} className="pb-news-row" to={`/news/${item.id}`}>
                <div className={`pb-news-row-thumb ${item.cover_url ? "" : "fallback"}`}>
                  {item.cover_url ? <img src={item.cover_url} alt="" loading="lazy" /> : null}
                  <span className={`pb-news-row-badge ${cat}`}>{t(`news.cat.${cat}`)}</span>
                </div>
                <div className="pb-news-row-body">
                  <h3 className="pb-news-row-title">{item.title}</h3>
                  {item.summary ? <p className="pb-news-row-summary">{item.summary}</p> : null}
                  <div className="pb-news-row-meta">
                    <span>{formatDate(item.published_at, language, t("common.noDate"))}</span>
                    <span className="dot" />
                    <span>{t("news.minRead", { min: readMinutes(item.body) })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* Кнопка добавления для персонала */}
      {isStaff ? (
        <button type="button" className="pb-news-fab-add" onClick={() => setEditorOpen(true)}>
          ＋ {t("news.editor.add")}
        </button>
      ) : null}

      <NewsEditor open={editorOpen} onClose={() => setEditorOpen(false)} onSaved={handleSaved} />
    </Layout>
  );
}
