import { type FormEvent, useMemo, useState } from "react";

import { api } from "../../services/api";
import { BottomSheet } from "./BottomSheet";
import {
  createAdDraftFromItem,
  createEmptyAdDraft,
  toShortText,
  textError,
  type AdCampaign,
  type AdDraft,
  type Language,
} from "./shared";

type AdsTabProps = {
  language: Language;
  ads: AdCampaign[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function AdsTab({ language, ads, onReload, onNotify }: AdsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [sheetMode, setSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdDraft>(createEmptyAdDraft());
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ads;
    return ads.filter((item) => `${item.title} ${item.body} ${item.cta_text ?? ""}`.toLowerCase().includes(q));
  }, [ads, query]);

  const openCreate = () => {
    setDraft(createEmptyAdDraft());
    setSheetId(null);
    setSheetMode("create");
  };

  const openEdit = (item: AdCampaign) => {
    setDraft(createAdDraftFromItem(item));
    setSheetId(item.id);
    setSheetMode("edit");
  };

  const close = () => {
    setSheetMode("closed");
    setSheetId(null);
    setSaving(false);
  };

  const update = <K extends keyof AdDraft>(key: K, value: AdDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = async (item: AdCampaign) => {
    try {
      await api.adminUpdateAd(item.id, { is_active: !item.is_active });
      onNotify(item.is_active ? tx("Реклама отключена", "Ad disabled") : tx("Реклама включена", "Ad enabled"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось обновить рекламу", "Failed to update ad")), "error");
    }
  };

  const onDelete = async (adId: string) => {
    if (!window.confirm(tx("Удалить рекламу?", "Delete ad?"))) return;
    try {
      await api.adminDeleteAd(adId);
      onNotify(tx("Реклама удалена", "Ad deleted"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось удалить рекламу", "Failed to delete ad")), "error");
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || !body) {
      onNotify(tx("Заполните заголовок и текст", "Fill title and text"), "error");
      return;
    }

    const payload = {
      title,
      body,
      image_url: draft.image_url.trim() || undefined,
      cta_text: draft.cta_text.trim() || undefined,
      cta_url: draft.cta_url.trim() || undefined,
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order) || 0,
    };

    setSaving(true);
    try {
      if (sheetMode === "create") {
        await api.adminCreateAd(payload);
        onNotify(tx("Реклама добавлена", "Ad created"), "success");
      } else if (sheetMode === "edit" && sheetId) {
        await api.adminUpdateAd(sheetId, payload);
        onNotify(tx("Реклама обновлена", "Ad updated"), "success");
      }
      close();
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось сохранить рекламу", "Failed to save ad")), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <button className="btn" type="button" onClick={openCreate}>
            {tx("Добавить рекламу", "Add ad")}
          </button>
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск по рекламе", "Search ads")} />
        </div>
      </div>
      <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
        {tx("Показывается в popup по тапу на подарок 🎁 на главной", "Shown in the popup when tapping the gift 🎁 on the home screen")}
      </p>

      <div className="admin-list admin-list-compact">
        {visible.map((item) => (
          <article key={item.id} className="prediction-card admin-item admin-card-compact">
            <div className="prediction-top admin-card-title-row">
              <strong>{item.title}</strong>
              <span className={`badge ${item.is_active ? "success" : "pending"}`}>{item.is_active ? tx("Активна", "Active") : tx("Выключена", "Inactive")}</span>
            </div>
            {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginTop: 6 }} /> : null}
            <p className="stacked">{toShortText(item.body, 160)}</p>
            <div className="admin-meta-row">
              <span>{tx("кнопка", "button")}: {item.cta_text || "—"}</span>
              <span>{tx("сортировка", "sort")}: {item.sort_order}</span>
            </div>
            <div className="admin-quick-actions">
              <button className="btn ghost" type="button" onClick={() => openEdit(item)}>
                {tx("Редактировать", "Edit")}
              </button>
              <button className="btn" type="button" onClick={() => void onToggle(item)}>
                {item.is_active ? tx("Отключить", "Disable") : tx("Включить", "Enable")}
              </button>
              <button className="btn danger" type="button" onClick={() => void onDelete(item.id)}>
                {tx("Удалить", "Delete")}
              </button>
            </div>
          </article>
        ))}
      </div>

      <BottomSheet
        open={sheetMode !== "closed"}
        title={sheetMode === "create" ? tx("Новая реклама", "New ad") : tx("Редактирование рекламы", "Edit ad")}
        onClose={close}
      >
        <form className="admin-sheet-form" onSubmit={onSubmit}>
          <section className="admin-editor-section">
            <h4 className="admin-section-title">
              <span className="emoji">🎁</span>
              {tx("Реклама в подарок", "Gift ad")}
            </h4>
            <input value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder={tx("Заголовок", "Title")} required />
            <textarea value={draft.body} onChange={(e) => update("body", e.target.value)} rows={6} placeholder={tx("Текст рекламы", "Ad text")} required />
            <input value={draft.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder={tx("URL картинки (обложка)", "Image URL (cover)")} />
            {draft.image_url ? <img src={draft.image_url} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginTop: 4 }} /> : null}
            <div className="admin-grid-2">
              <input value={draft.cta_text} onChange={(e) => update("cta_text", e.target.value)} placeholder={tx("Текст кнопки", "Button text")} />
              <input value={draft.cta_url} onChange={(e) => update("cta_url", e.target.value)} placeholder={tx("Ссылка кнопки", "Button URL")} />
            </div>
            <input type="number" value={draft.sort_order} onChange={(e) => update("sort_order", e.target.value)} placeholder={tx("Сортировка", "Sort order")} />
            <label className="switch-row" style={{ padding: "0 4px" }}>
              <span>{tx("Активна", "Active")}</span>
              <input type="checkbox" checked={draft.is_active} onChange={(e) => update("is_active", e.target.checked)} />
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
