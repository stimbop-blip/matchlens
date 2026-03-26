import { useEffect, useState } from "react";

import { useLanguage } from "../app/language";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
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

  const isRu = language === "ru";

  return (
    <Layout>
      <section className="card home-section">
        <div className="section-head">
          <h2>{isRu ? "Новости PIT BET" : "PIT BET News"}</h2>
          <span className="muted">{isRu ? "Проект и обновления" : "Project updates"}</span>
        </div>

        {loading ? <p className="muted">{isRu ? "Загружаем новости..." : "Loading news..."}</p> : null}
        {!loading && items.length === 0 ? (
          <p className="empty-state">{isRu ? "Пока нет новостей." : "No news yet."}</p>
        ) : null}

        <div className="home-news-list">
          {items.map((item) => (
            <article key={item.id} className="home-news-item">
              <div className="home-news-head">
                <strong>{item.title}</strong>
                <span className="badge info">{item.category}</span>
              </div>
              <p className="news-page-body">{item.body}</p>
              <div className="home-news-meta">{formatDate(item.published_at, language)}</div>
            </article>
          ))}
        </div>
      </section>
      <AppDisclaimer />
    </Layout>
  );
}
