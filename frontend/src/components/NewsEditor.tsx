import { type FormEvent, useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { api, type NewsPost } from "../services/api";

type Category = "pit" | "bets";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (post: NewsPost) => void;
  /** если передан — режим редактирования */
  editing?: NewsPost | null;
};

export function NewsEditor({ open, onClose, onSaved, editing }: Props) {
  const { t } = useI18n();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [category, setCategory] = useState<Category>("pit");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // синхронизируем форму при открытии
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setSummary(editing.summary ?? "");
      setBody(editing.body);
      setCoverUrl(editing.cover_url ?? "");
      setCategory((editing.category === "bets" ? "bets" : "pit") as Category);
      setPublished(editing.is_published);
    } else {
      setTitle("");
      setSummary("");
      setBody("");
      setCoverUrl("");
      setCategory("pit");
      setPublished(true);
    }
    setError("");
  }, [open, editing]);

  if (!open) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        body: body.trim(),
        cover_url: coverUrl.trim() || undefined,
        category,
        is_published: published,
      };
      const saved = editing
        ? await api.adminUpdateNews(editing.id, payload)
        : await api.adminCreateNews(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("news.editor.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    if (!window.confirm(t("news.editor.deleteConfirm"))) return;
    setSaving(true);
    try {
      await api.adminDeleteNews(editing.id);
      onSaved({ ...editing, is_published: false });
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("news.editor.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-news-editor-overlay" onClick={onClose}>
      <form className="pb-news-editor" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="pb-news-editor-head">
          <h3>{editing ? t("news.editor.editTitle") : t("news.editor.title")}</h3>
          <button type="button" className="pb-news-editor-close" onClick={onClose} aria-label="close">
            ×
          </button>
        </div>

        <div className="pb-news-editor-field">
          <label>{t("news.editor.titleLabel")}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("news.editor.titlePlaceholder")}
            maxLength={255}
          />
        </div>

        <div className="pb-news-editor-field">
          <label>{t("news.editor.summaryLabel")}</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t("news.editor.summaryPlaceholder")}
            maxLength={400}
          />
        </div>

        <div className="pb-news-editor-field">
          <label>{t("news.editor.categoryLabel")}</label>
          <div className="pb-news-editor-cat-row">
            {(["pit", "bets"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`pb-news-editor-cat ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {t(`news.cat.${c}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-news-editor-field">
          <label>{t("news.editor.bodyLabel")}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("news.editor.bodyPlaceholder")}
            rows={6}
          />
        </div>

        <div className="pb-news-editor-field">
          <label>{t("news.editor.coverLabel")}</label>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder={t("news.editor.coverPlaceholder")}
          />
        </div>

        <label className="pb-news-editor-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span>{t("news.editor.publishedLabel")}</span>
        </label>

        {error ? <p className="pb-notice error">{error}</p> : null}

        <div className="pb-news-editor-actions">
          {editing ? (
            <button type="button" className="pb-news-editor-btn danger" onClick={onDelete} disabled={saving}>
              {t("news.editor.delete")}
            </button>
          ) : null}
          <button type="submit" className="pb-news-editor-btn primary" disabled={saving || !title.trim() || !body.trim()}>
            {saving ? t("news.editor.saving") : t("news.editor.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
