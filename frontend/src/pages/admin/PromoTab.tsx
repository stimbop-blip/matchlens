import { type FormEvent, useMemo, useState } from "react";

import { api } from "../../services/api";
import { BottomSheet } from "./BottomSheet";
import {
  createEmptyPromoDraft,
  createPromoDraftFromItem,
  formatDateTime,
  toDateTimeLocal,
  textError,
  type AdminPromoCode,
  type Language,
  type PromoDraft,
  type PromoFilter,
} from "./shared";

type PromoTabProps = {
  language: Language;
  promoCodes: AdminPromoCode[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function PromoTab({ language, promoCodes, onReload, onNotify }: PromoTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromoFilter>("all");

  const [sheetMode, setSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromoDraft>(createEmptyPromoDraft());
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return promoCodes.filter((promo) => {
      if (statusFilter === "active" && !promo.is_active) return false;
      if (statusFilter === "inactive" && promo.is_active) return false;
      if (!q) return true;
      const base = `${promo.code} ${promo.title} ${promo.description || ""} ${promo.kind}`.toLowerCase();
      return base.includes(q);
    });
  }, [promoCodes, query, statusFilter]);

  const openCreate = () => {
    setDraft(createEmptyPromoDraft());
    setSheetId(null);
    setSheetMode("create");
  };

  const openEdit = (item: AdminPromoCode) => {
    setDraft(createPromoDraftFromItem(item));
    setSheetId(item.id);
    setSheetMode("edit");
  };

  const close = () => {
    setSheetMode("closed");
    setSheetId(null);
    setSaving(false);
  };

  const update = <K extends keyof PromoDraft>(key: K, value: PromoDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = async (item: AdminPromoCode) => {
    try {
      await api.adminUpdatePromoCode(item.id, { is_active: !item.is_active });
      onNotify(item.is_active ? tx("Промокод отключен", "Promo code disabled") : tx("Промокод активирован", "Promo code enabled"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось обновить промокод", "Failed to update promo code")), "error");
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm(tx("Удалить промокод?", "Delete promo code?"))) return;
    try {
      await api.adminDeletePromoCode(id);
      onNotify(tx("Промокод удален", "Promo code deleted"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось удалить промокод", "Failed to delete promo code")), "error");
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = draft.title.trim();
    const value = Number(draft.value);
    if (!title || !Number.isFinite(value) || value < 0) {
      onNotify(tx("Проверьте поля промокода", "Check promo code fields"), "error");
      return;
    }

    setSaving(true);
    try {
      if (sheetMode === "create") {
        const code = draft.code.trim();
        if (!code) {
          onNotify(tx("Укажите код промокода", "Provide promo code"), "error");
          setSaving(false);
          return;
        }
        await api.adminCreatePromoCode({
          code,
          title,
          description: draft.description.trim() || undefined,
          kind: draft.kind,
          value,
          tariff_code: (draft.tariff_code || undefined) as "free" | "premium" | "vip" | undefined,
          max_activations: draft.max_activations.trim() ? Number(draft.max_activations) : undefined,
          expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : undefined,
          is_active: draft.is_active,
        });
        onNotify(tx("Промокод добавлен", "Promo code created"), "success");
      } else if (sheetMode === "edit" && sheetId) {
        await api.adminUpdatePromoCode(sheetId, {
          title,
          description: draft.description.trim() || undefined,
          kind: draft.kind,
          value,
          tariff_code: (draft.tariff_code || undefined) as "free" | "premium" | "vip" | undefined,
          max_activations: draft.max_activations.trim() ? Number(draft.max_activations) : undefined,
          expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : undefined,
          is_active: draft.is_active,
        });
        onNotify(tx("Промокод обновлен", "Promo code updated"), "success");
      }
      close();
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось сохранить промокод", "Failed to save promo code")), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <button className="btn" type="button" onClick={openCreate}>
            {tx("Создать промокод", "Create promo code")}
          </button>
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск: код или название", "Search: code or title")} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PromoFilter)}>
            <option value="all">{tx("Все", "All")}</option>
            <option value="active">{tx("Активные", "Active")}</option>
            <option value="inactive">{tx("Неактивные", "Inactive")}</option>
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((promo) => (
          <article key={promo.id} className="prediction-card admin-item admin-card-compact">
            <div className="prediction-top admin-card-title-row">
              <strong>{promo.code}</strong>
              <span className={`badge ${promo.is_active ? "success" : "lost"}`}>{promo.is_active ? tx("Активен", "Active") : tx("Отключен", "Inactive")}</span>
            </div>
            <p className="muted admin-card-sub">{promo.title}</p>
            <div className="admin-meta-row">
              <span>{promo.kind}</span>
              <span>{tx("значение", "value")}: {promo.value}</span>
              <span>{tx("до", "valid until")}: {promo.expires_at ? formatDateTime(promo.expires_at, isRu) : tx("без срока", "no limit")}</span>
            </div>
            <p className="muted">{tx("Активации", "Activations")}: {promo.activations}{promo.max_activations ? `/${promo.max_activations}` : ""}</p>
            <div className="admin-quick-actions">
              <button className="btn ghost" type="button" onClick={() => openEdit(promo)}>
                {tx("Редактировать", "Edit")}
              </button>
              <button className="btn" type="button" onClick={() => void onToggle(promo)}>
                {promo.is_active ? tx("Деактивировать", "Deactivate") : tx("Активировать", "Activate")}
              </button>
              <button className="btn danger" type="button" onClick={() => void onDelete(promo.id)}>
                {tx("Удалить", "Delete")}
              </button>
            </div>
          </article>
        ))}
      </div>

      <BottomSheet
        open={sheetMode !== "closed"}
        title={sheetMode === "create" ? tx("Новый промокод", "New promo code") : tx("Редактирование промокода", "Edit promo code")}
        onClose={close}
      >
        <form className="admin-sheet-form" onSubmit={onSubmit}>
          <section className="admin-editor-section">
            <h4 className="admin-section-title">
              <span className="emoji">🏷</span>
              {tx("Параметры промокода", "Promo code settings")}
            </h4>
            <input value={draft.code} onChange={(e) => update("code", e.target.value)} placeholder={tx("Код", "Code")} disabled={sheetMode === "edit"} required />
            <input value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder={tx("Название", "Title")} required />
            <textarea value={draft.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder={tx("Описание", "Description")} />
            <div className="admin-grid-2">
              <select value={draft.kind} onChange={(e) => update("kind", e.target.value as PromoDraft["kind"])}>
                <option value="percent_discount">{tx("Скидка в процентах", "Percent discount")}</option>
                <option value="fixed_discount">{tx("Фиксированная скидка", "Fixed discount")}</option>
                <option value="extra_days">{tx("Бонусные дни", "Bonus days")}</option>
                <option value="free_access">{tx("Бесплатный доступ", "Free access")}</option>
              </select>
              <input value={draft.value} onChange={(e) => update("value", e.target.value)} type="number" min="0" placeholder={tx("Значение", "Value")} />
            </div>
            <div className="admin-grid-2">
              <select value={draft.tariff_code} onChange={(e) => update("tariff_code", e.target.value as PromoDraft["tariff_code"])}>
                <option value="">{tx("Любой тариф", "Any plan")}</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
              <input value={draft.max_activations} onChange={(e) => update("max_activations", e.target.value)} type="number" min="1" placeholder={tx("Лимит активаций", "Activation limit")} />
            </div>
            <input value={draft.expires_at} onChange={(e) => update("expires_at", e.target.value)} type="datetime-local" placeholder={tx("Срок действия", "Expiration")} />
            <label className="switch-row" style={{ padding: "0 4px" }}>
              <span>{tx("Активен", "Active")}</span>
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
