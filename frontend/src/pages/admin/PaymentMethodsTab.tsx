import { type FormEvent, useMemo, useState } from "react";

import { api } from "../../services/api";
import { BottomSheet } from "./BottomSheet";
import {
  createEmptyPaymentMethodDraft,
  createPaymentMethodDraftFromItem,
  toShortText,
  textError,
  type Language,
  type MethodFilter,
  type PaymentMethod,
  type PaymentMethodDraft,
} from "./shared";

type PaymentMethodsTabProps = {
  language: Language;
  paymentMethods: PaymentMethod[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function PaymentMethodsTab({ language, paymentMethods, onReload, onNotify }: PaymentMethodsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MethodFilter>("all");

  const [sheetMode, setSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PaymentMethodDraft>(createEmptyPaymentMethodDraft());
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return paymentMethods.filter((item) => {
      if (statusFilter === "active" && !item.is_active) return false;
      if (statusFilter === "inactive" && item.is_active) return false;
      if (!q) return true;
      const base = `${item.code} ${item.name} ${item.method_type} ${item.card_number || ""} ${item.recipient_name || ""}`.toLowerCase();
      return base.includes(q);
    });
  }, [paymentMethods, query, statusFilter]);

  const openCreate = () => {
    setDraft(createEmptyPaymentMethodDraft());
    setSheetId(null);
    setSheetMode("create");
  };

  const openEdit = (item: PaymentMethod) => {
    setDraft(createPaymentMethodDraftFromItem(item));
    setSheetId(item.code);
    setSheetMode("edit");
  };

  const close = () => {
    setSheetMode("closed");
    setSheetId(null);
    setSaving(false);
  };

  const update = <K extends keyof PaymentMethodDraft>(key: K, value: PaymentMethodDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onToggle = async (item: PaymentMethod) => {
    try {
      await api.adminUpdatePaymentMethod(item.code, { is_active: !item.is_active });
      onNotify(item.is_active ? tx("Метод отключен", "Method disabled") : tx("Метод включен", "Method enabled"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось обновить метод", "Failed to update method")), "error");
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = draft.code.trim();
    const name = draft.name.trim();
    if (!code || !name) {
      onNotify(tx("Заполните код и название метода", "Fill method code and name"), "error");
      return;
    }

    const payload: PaymentMethod = {
      code,
      name,
      method_type: draft.method_type,
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order) || 100,
      card_number: draft.card_number.trim() || null,
      recipient_name: draft.recipient_name.trim() || null,
      payment_details: draft.payment_details.trim() || null,
      instructions: draft.instructions.trim() || null,
    };

    setSaving(true);
    try {
      if (sheetMode === "create") {
        await api.adminCreatePaymentMethod(payload);
        onNotify(tx("Метод оплаты создан", "Payment method created"), "success");
      } else if (sheetMode === "edit" && sheetId) {
        await api.adminUpdatePaymentMethod(sheetId, {
          name: payload.name,
          method_type: payload.method_type,
          is_active: payload.is_active,
          sort_order: payload.sort_order,
          card_number: payload.card_number,
          recipient_name: payload.recipient_name,
          payment_details: payload.payment_details,
          instructions: payload.instructions,
        });
        onNotify(tx("Метод оплаты обновлен", "Payment method updated"), "success");
      }
      close();
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось сохранить метод оплаты", "Failed to save payment method")), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <button className="btn" type="button" onClick={openCreate}>
            {tx("Добавить метод", "Add method")}
          </button>
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск: код, название", "Search: code, name")} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MethodFilter)}>
            <option value="all">{tx("Все", "All")}</option>
            <option value="active">{tx("Активные", "Active")}</option>
            <option value="inactive">{tx("Неактивные", "Inactive")}</option>
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((method) => (
          <article key={method.code} className="prediction-card admin-item admin-card-compact">
            <div className="prediction-top admin-card-title-row">
              <strong>{method.name}</strong>
              <span className={`badge ${method.is_active ? "success" : "failed"}`}>{method.is_active ? tx("Активен", "Active") : tx("Неактивен", "Inactive")}</span>
            </div>
            <p className="muted admin-card-sub">{method.code} • {method.method_type === "manual" ? tx("Ручной", "Manual") : tx("Авто", "Auto")}</p>
            {method.card_number ? <p className="muted">{tx("Карта", "Card")}: {method.card_number}</p> : null}
            {method.recipient_name ? <p className="muted">{tx("Получатель", "Recipient")}: {method.recipient_name}</p> : null}
            {method.instructions ? <p className="stacked">{toShortText(method.instructions, 150)}</p> : null}
            <div className="admin-quick-actions">
              <button className="btn ghost" type="button" onClick={() => openEdit(method)}>
                {tx("Редактировать", "Edit")}
              </button>
              <button className="btn" type="button" onClick={() => void onToggle(method)}>
                {method.is_active ? tx("Отключить", "Disable") : tx("Включить", "Enable")}
              </button>
            </div>
          </article>
        ))}
      </div>

      <BottomSheet
        open={sheetMode !== "closed"}
        title={sheetMode === "create" ? tx("Новый способ оплаты", "New payment method") : tx("Редактирование способа оплаты", "Edit payment method")}
        onClose={close}
      >
        <form className="admin-sheet-form" onSubmit={onSubmit}>
          <section className="admin-editor-section">
            <h4 className="admin-section-title">
              <span className="emoji">💳</span>
              {tx("Параметры способа оплаты", "Payment method settings")}
            </h4>
            <div className="admin-grid-2">
              <input value={draft.code} onChange={(e) => update("code", e.target.value)} placeholder={tx("Код", "Code")} disabled={sheetMode === "edit"} required />
              <input value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder={tx("Название", "Name")} required />
            </div>
            <div className="admin-grid-3">
              <select value={draft.method_type} onChange={(e) => update("method_type", e.target.value as "auto" | "manual")}>
                <option value="manual">{tx("Ручной", "Manual")}</option>
                <option value="auto">{tx("Авто", "Auto")}</option>
              </select>
              <input value={draft.sort_order} onChange={(e) => update("sort_order", e.target.value)} type="number" placeholder={tx("Порядок", "Sort order")} />
              <label className="switch-row" style={{ padding: "0 4px" }}>
                <span>{tx("Активен", "Active")}</span>
                <input type="checkbox" checked={draft.is_active} onChange={(e) => update("is_active", e.target.checked)} />
              </label>
            </div>
            <input value={draft.card_number} onChange={(e) => update("card_number", e.target.value)} placeholder={tx("Номер карты", "Card number")} />
            <input value={draft.recipient_name} onChange={(e) => update("recipient_name", e.target.value)} placeholder={tx("Получатель", "Recipient")} />
            <input value={draft.payment_details} onChange={(e) => update("payment_details", e.target.value)} placeholder={tx("Реквизиты", "Payment details")} />
            <textarea value={draft.instructions} onChange={(e) => update("instructions", e.target.value)} rows={4} placeholder={tx("Инструкция для пользователя", "User instructions")} />
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
