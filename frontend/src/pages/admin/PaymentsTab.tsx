import { useMemo, useState } from "react";

import { api } from "../../services/api";
import {
  accessLabel,
  formatDateTime,
  proofLooksLikeImage,
  statusLabel,
  toShortText,
  textError,
  type AdminPayment,
  type Language,
  type PaymentMethod,
} from "./shared";

type PaymentsTabProps = {
  language: Language;
  payments: AdminPayment[];
  paymentMethods: PaymentMethod[];
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

export function PaymentsTab({ language, payments, paymentMethods, onReload, onNotify }: PaymentsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== "all" && payment.status !== statusFilter) return false;
      if (methodFilter !== "all" && (payment.method_code || "") !== methodFilter) return false;
      if (!q) return true;
      const base = `${payment.username || ""} ${payment.telegram_id} ${payment.provider_order_id} ${payment.method_name || ""} ${payment.method_code || ""}`.toLowerCase();
      return base.includes(q);
    });
  }, [payments, query, statusFilter, methodFilter]);

  const onPaymentStatus = async (
    paymentId: string,
    status: "pending" | "pending_manual_review" | "requires_clarification" | "succeeded" | "failed" | "canceled",
    reviewComment?: string,
  ) => {
    try {
      await api.adminUpdatePaymentStatus(paymentId, status, reviewComment);
      onNotify(tx("Статус платежа обновлен", "Payment status updated"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось обновить платеж", "Failed to update payment")), "error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск: пользователь, order id", "Search: user, order id")} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{tx("Все статусы", "All statuses")}</option>
            <option value="pending">{tx("В ожидании", "Pending")}</option>
            <option value="pending_manual_review">{tx("На проверке", "Manual review")}</option>
            <option value="requires_clarification">{tx("Нужно уточнение", "Needs clarification")}</option>
            <option value="succeeded">{tx("Подтвержден", "Approved")}</option>
            <option value="failed">{tx("Отклонен", "Rejected")}</option>
            <option value="canceled">{tx("Отменен", "Canceled")}</option>
          </select>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="all">{tx("Все методы", "All methods")}</option>
            {paymentMethods.map((method) => (
              <option key={method.code} value={method.code}>
                {method.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((payment) => {
          const proof = (payment.manual_proof || "").trim();
          return (
            <article key={payment.id} className="prediction-card admin-item admin-card-compact">
              <div className="prediction-top admin-card-title-row">
                <strong>@{payment.username || payment.telegram_id}</strong>
                <span className={`badge ${payment.status}`}>{statusLabel(payment.status, language)}</span>
              </div>
              <div className="admin-meta-row">
                <span>{accessLabel(payment.access_level, language)}</span>
                <span>{payment.duration_days} {tx("дней", "days")}</span>
                <span>{payment.amount_rub} RUB</span>
              </div>
              <p className="muted admin-card-sub">{tx("Метод", "Method")}: {payment.method_name || payment.method_code || "-"} • {formatDateTime(payment.created_at, isRu)}</p>
              {payment.manual_note ? <p className="stacked">{tx("Комментарий", "Comment")}: {toShortText(payment.manual_note, 140)}</p> : null}
              {payment.review_comment ? <p className="stacked">{tx("Комментарий админа", "Admin comment")}: {toShortText(payment.review_comment, 140)}</p> : null}
              {proof ? (
                <div className="admin-proof-block">
                  <a href={proof} target="_blank" rel="noreferrer" className="admin-proof-link">
                    {tx("Открыть подтверждение", "Open proof")}
                  </a>
                  {proofLooksLikeImage(proof) ? <img src={proof} alt={tx("Подтверждение платежа", "Payment proof")} loading="lazy" className="admin-proof-image" /> : null}
                </div>
              ) : null}

              <div className="admin-quick-actions three">
                <button className="btn" type="button" onClick={() => void onPaymentStatus(payment.id, "succeeded")}>
                  {tx("Подтвердить", "Approve")}
                </button>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => {
                    const comment = window.prompt(tx("Что нужно уточнить у пользователя?", "What should be clarified with user?")) || "";
                    if (!comment.trim()) return;
                    void onPaymentStatus(payment.id, "requires_clarification", comment.trim());
                  }}
                >
                  {tx("Уточнить", "Clarify")}
                </button>
                <button
                  className="btn danger"
                  type="button"
                  onClick={() => {
                    const reason = window.prompt(tx("Причина отклонения", "Rejection reason")) || "";
                    void onPaymentStatus(payment.id, "failed", reason.trim() || undefined);
                  }}
                >
                  {tx("Отклонить", "Reject")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
