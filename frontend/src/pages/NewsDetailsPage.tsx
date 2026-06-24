import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { Layout } from "../components/Layout";
import { NewsEditor } from "../components/NewsEditor";
import { api, type NewsPost } from "../services/api";

function parseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function formatDateTime(value: string | null, language: "ru" | "en", fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string | null, language: "ru" | "en", fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 190));
}

function categoryKey(category: string): string {
  return category === "bets" ? "bets" : "pit";
}

export function NewsDetailsPage() {
  const { t, language } = useI18n();
  const { newsId } = useParams<{ newsId: string }>();

  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isStaff, setIsStaff] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // НЕ зависим от `t` (пересоздаётся каждый рендер → бесконечный цикл загрузки)
  const errorFallback = useRef(t("news.error"));
  errorFallback.current = t("news.error");

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
        setError(parseErrorMessage(e, errorFallback.current));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    api
      .me()
      .then((me) => {
        setIsStaff(Boolean(me.role === "admin" || me.role === "support" || me.is_admin || me.is_support));
      })
      .catch(() => undefined);
  }, []);

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

  if (loading) {
    return (
      <Layout>
        <p className="pb-empty-state">{t("news.article.loading")}</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="pb-error-state">
          <p>{error}</p>
          <button className="pb-btn pb-btn-ghost" type="button" onClick={() => setReloadKey((p) => p + 1)}>
            {t("common.retry")}
          </button>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <p className="pb-empty-state">{t("news.article.empty")}</p>
        <div className="pb-news-list2">
          <Link className="pb-news-editor-btn primary pb-news-editor-btn" to="/news" style={{ textAlign: "center", textDecoration: "none" }}>
            {t("news.article.back")}
          </Link>
        </div>
      </Layout>
    );
  }

  const cat = categoryKey(post.category);

  return (
    <Layout>
      {/* Статья с обложкой */}
      <article className="pb-news-article2">
        <div className={`pb-news-article2-cover ${post.cover_url ? "" : "fallback"}`}>
          {post.cover_url ? <img src={post.cover_url} alt="" /> : null}
          <span className={`pb-news-card2-badge ${cat}`}>{t(`news.cat.${cat}`)}</span>
        </div>

        <div className="pb-news-article2-body">
          <h1 className="pb-news-article2-title">{post.title}</h1>

          {/* Мета: дата · время · чтение */}
          <div className="pb-news-article2-meta">
            <span>{formatDateTime(post.published_at, language, t("common.noDate"))}</span>
            <span className="dot" />
            <span>{formatTime(post.published_at, language, "—")}</span>
            <span className="dot" />
            <span>{t("news.minRead", { min: readMinutes(post.body) })}</span>
          </div>

          <div className="pb-news-article2-text">{post.body}</div>

          {isStaff ? (
            <div className="pb-news-editor-actions" style={{ marginTop: 18 }}>
              <button type="button" className="pb-news-editor-btn primary" onClick={() => setEditorOpen(true)}>
                {t("news.editor.edit")}
              </button>
            </div>
          ) : null}
        </div>
      </article>

      {/* Похожие материалы */}
      {related.length > 0 ? (
        <section style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            {t("news.article.related")}
          </h3>
          <div className="pb-news-list2">
            {related.map((item) => (
              <Link key={item.id} className="pb-news-card2" to={`/news/${item.id}`}>
                <div className={`pb-news-card2-cover ${item.cover_url ? "" : "fallback"}`}>
                  {item.cover_url ? <img src={item.cover_url} alt="" loading="lazy" /> : null}
                  <span className={`pb-news-card2-badge ${categoryKey(item.category)}`}>
                    {t(`news.cat.${categoryKey(item.category)}`)}
                  </span>
                </div>
                <div className="pb-news-card2-body">
                  <h3 className="pb-news-card2-title">{item.title}</h3>
                  <div className="pb-news-card2-meta">
                    <span>{formatDateTime(item.published_at, language, t("common.noDate"))}</span>
                    <span className="dot" />
                    <span>{t("news.minRead", { min: readMinutes(item.body) })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <Link className="pb-news-editor-btn primary pb-news-editor-btn" to="/news" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
          {t("news.article.back")}
        </Link>
      </div>

      <NewsEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editing={post}
        onSaved={() => setReloadKey((p) => p + 1)}
      />
    </Layout>
  );
}
