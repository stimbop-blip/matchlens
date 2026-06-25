import { type FormEvent, useMemo, useState } from "react";

import { api } from "../../services/api";
import { BottomSheet } from "./BottomSheet";
import {
  createEmptyNewsDraft,
  createNewsDraftFromItem,
  extractNewsPreviewAndBody,
  formatDateTime,
  joinNewsPreviewAndBody,
  toShortText,
  textError,
  type Language,
  type NewsDraft,
  type NewsFilter,
  type NewsPost,
} from "./shared";

type NewsTabProps = {
  language: Language;
  news: NewsPost[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function NewsTab({ language, news, onReload, onNotify }: NewsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsFilter>("all");

  const [sheetMode, setSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewsDraft>(createEmptyNewsDraft());
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter((item) => {
      if (statusFilter === "published" && !item.is_published) return false;
      if (statusFilter === "draft" && item.is_published) return false;
      if (!q) return true;
      const base = `${item.title} ${item.body} ${item.category}`.toLowerCase();
      return base.includes(q);
    });
  }, [news, query, statusFilter]);

  const openCreate = () => {
    setDraft(createEmptyNewsDraft());
    setSheetId(null);
    setSheetMode("create");
  };

  const openEdit = (item: NewsPost) => {
    setDraft(createNewsDraftFromItem(item));
    setSheetId(item.id);
    setSheetMode("edit");
  };

  const close = () => {
    setSheetMode("closed");
    setSheetId(null);
    setSaving(false);
  };

  const update = <K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = async (item: NewsPost) => {
    try {
      await api.adminUpdateNews(item.id, { is_published: !item.is_published });
      onNotify(item.is_published ? tx("Новость снята с публикации", "News post unpublished") : tx("Новость опубликована", "News post published"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось обновить новость", "Failed to update news post")), "error");
    }
  };

  const onDelete = async (newsId: string) => {
    if (!window.confirm(tx("Удалить новость?", "Delete news post?"))) return;
    try {
      await api.adminDeleteNews(newsId);
      onNotify(tx("Новость удалена", "News post deleted"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось удалить новость", "Failed to delete news post")), "error");
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = draft.title.trim();
    const body = joinNewsPreviewAndBody(draft.preview, draft.body);
    if (!title || !body.trim()) {
      onNotify(tx("Заполните заголовок и текст", "Fill title and text"), "error");
      return;
    }

    setSaving(true);
    try {
      if (sheetMode === "create") {
        await api.adminCreateNews({ title, body, category: draft.category.trim() || "news", is_published: draft.is_published });
        onNotify(tx("Новость добавлена", "News post created"), "success");
      } else if (sheetMode === "edit" && sheetId) {
        await api.adminUpdateNews(sheetId, { title, body, category: draft.category.trim() || "news", is_published: draft.is_published });
        onNotify(tx("Новость обновлена", "News post updated"), "success");
      }
      close();
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось сохранить новость", "Failed to save news")), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <button className="btn" type="button" onClick={openCreate}>
            {tx("Добавить новость", "Add news")}
          </button>
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск по новостям", "Search news")} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as NewsFilter)}>
            <option value="all">{tx("Все", "All")}</option>
            <option value="published">{tx("Опубликованные", "Published")}</option>
            <option value="draft">{tx("Черновики", "Drafts")}</option>
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((item) => {
          const parsed = extractNewsPreviewAndBody(item.body || "");
          return (
            <article key={item.id} className="prediction-card admin-item admin-card-compact">
              <div className="prediction-top admin-card-title-row">
                <strong>{item.title}</strong>
                <span className={`badge ${item.is_published ? "success" : "pending"}`}>{item.is_published ? tx("Опубликовано", "Published") : tx("Черновик", "Draft")}</span>
              </div>
              <p className="muted admin-card-sub">{formatDateTime(item.published_at, isRu)}</p>
              <p className="stacked">{toShortText(parsed.preview || item.body, 180)}</p>
              <div className="admin-quick-actions">
                <button className="btn ghost" type="button" onClick={() => openEdit(item)}>
                  {tx("Редактировать", "Edit")}
                </button>
                <button className="btn" type="button" onClick={() => void onToggle(item)}>
                  {item.is_published ? tx("Снять", "Unpublish") : tx("Опубликовать", "Publish")}
                </button>
                <button className="btn danger" type="button" onClick={() => void onDelete(item.id)}>
                  {tx("Удалить", "Delete")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <BottomSheet
        open={sheetMode !== "closed"}
        title={sheetMode === "create" ? tx("Новая новость", "New news") : tx("Редактирование новости", "Edit news")}
        onClose={close}
      >
        <form className="admin-sheet-form" onSubmit={onSubmit}>
          <section className="admin-editor-section">
            <h4 className="admin-section-title">
              <span className="emoji">📰</span>
              {tx("Новость", "News")}
            </h4>
            <input value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder={tx("Заголовок", "Title")} required />
            <textarea value={draft.preview} onChange={(e) => update("preview", e.target.value)} rows={3} placeholder={tx("Краткое описание (preview)", "Preview")} />
            <textarea value={draft.body} onChange={(e) => update("body", e.target.value)} rows={8} placeholder={tx("Текст", "Text")} required />
            <input value={draft.category} onChange={(e) => update("category", e.target.value)} placeholder={tx("Категория", "Category")} />
            <label className="switch-row" style={{ padding: "0 4px" }}>
              <span>{tx("Опубликовать", "Publish")}</span>
              <input type="checkbox" checked={draft.is_published} onChange={(e) => update("is_published", e.target.checked)} />
            </label>
          </section>
          <div className="admin-sheet-footer">
            <button className="btn ghost" type="button" onClick={close}>
              {tx("Отмена", "Cancel")}
            </button>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? tx("Сохраняем...", "Saving...") : tx("Сохранить", "Save")}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
