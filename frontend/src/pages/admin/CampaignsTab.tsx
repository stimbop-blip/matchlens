import { useMemo, useState } from "react";

import { api } from "../../services/api";
import {
  reportAccessLabel,
  reportPeriodLabel,
  textError,
  type Language,
  type NotificationDeliveryStatsLike,
  type ReportDigestAccess,
  type ReportPeriod,
} from "./shared";

type CampaignsTabProps = {
  language: Language;
  deliveryStats: NotificationDeliveryStatsLike | null;
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
};

type PreviewPayload = {
  title?: string | null;
  message?: string | null;
  button_text?: string | null;
  button_url?: string | null;
};

type DigestResult = {
  period: string;
  access_level: string;
  queued: number;
  queued_premium: number;
  queued_vip: number;
  skipped: number;
  skipped_dedupe: number;
  force_send: boolean;
};

export function CampaignsTab({ language, deliveryStats, onReload, onNotify }: CampaignsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [segment, setSegment] = useState("all");
  const [access, setAccess] = useState("all");
  const [notifOnly, setNotifOnly] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewPayload, setPreviewPayload] = useState<PreviewPayload | null>(null);

  const [digestAccess, setDigestAccess] = useState<ReportDigestAccess>("all");
  const [sendingPeriod, setSendingPeriod] = useState<ReportPeriod | null>(null);
  const [digestResult, setDigestResult] = useState<DigestResult | null>(null);

  const campaignTemplates = useMemo(
    () => [
      {
        id: "digest_daily",
        label: tx("Шаблон: daily digest", "Template: daily digest"),
        title: tx("PIT BET • Daily performance digest", "PIT BET • Daily performance digest"),
        message: tx(
          "Отчет за последние 24 часа готов. Откройте Mini App и проверьте актуальные сигналы, ROI и итог по банку.",
          "24h report is ready. Open Mini App to review latest signals, ROI, and bank summary.",
        ),
      },
      {
        id: "vip_weekly",
        label: tx("Шаблон: VIP weekly", "Template: VIP weekly"),
        title: tx("PIT BET • VIP weekly review", "PIT BET • VIP weekly review"),
        message: tx(
          "VIP-обзор за неделю готов: сильные сетапы, точность и динамика банка. Откройте приложение для полного отчета.",
          "VIP weekly review is ready: strongest setups, hit rate, and bank dynamics. Open the app for full report.",
        ),
      },
      {
        id: "reactivate",
        label: tx("Шаблон: вернуть в апп", "Template: re-engage"),
        title: tx("PIT BET • Новые сигналы уже в ленте", "PIT BET • New signals are live"),
        message: tx(
          "Добавили свежие сигналы и обновили статистику. Зайдите в Mini App, чтобы не пропустить лучшие входы.",
          "Fresh signals and updated stats are available. Open Mini App to catch the best entries.",
        ),
      },
    ],
    [tx],
  );

  const onPreview = async () => {
    const bt = buttonText.trim();
    const bu = buttonUrl.trim();
    if ((bt && !bu) || (!bt && bu)) {
      onNotify(tx("Для кнопки укажите и текст, и ссылку", "For button, provide both text and URL"), "error");
      return;
    }
    try {
      const preview = await api.adminCampaignPreview({
        segment,
        access_level: access === "all" ? undefined : access,
        notifications_enabled_only: notifOnly,
        title: title.trim() || undefined,
        message: message.trim() || undefined,
        button_text: bt || undefined,
        button_url: bu || undefined,
      });
      setPreviewCount(preview.count);
      setPreviewPayload(preview.preview || null);
      onNotify(tx(`Найдено получателей: ${preview.count}`, `Recipients found: ${preview.count}`), "info");
    } catch (e) {
      onNotify(textError(e, tx("Не удалось сделать превью рассылки", "Failed to preview campaign")), "error");
    }
  };

  const onSend = async () => {
    if (!title.trim() || !message.trim()) {
      onNotify(tx("Заполните заголовок и текст рассылки", "Fill campaign title and message"), "error");
      return;
    }
    const bt = buttonText.trim();
    const bu = buttonUrl.trim();
    if ((bt && !bu) || (!bt && bu)) {
      onNotify(tx("Для кнопки укажите и текст, и ссылку", "For button, provide both text and URL"), "error");
      return;
    }
    if (!window.confirm(tx("Подтвердить массовую рассылку?", "Confirm mass campaign send?"))) return;
    try {
      const result = await api.adminCampaignSend({
        title: title.trim(),
        message: message.trim(),
        segment,
        access_level: access === "all" ? undefined : access,
        notifications_enabled_only: notifOnly,
        button_text: bt || undefined,
        button_url: bu || undefined,
      });
      onNotify(tx(`Рассылка поставлена в очередь: ${result.queued}`, `Campaign queued: ${result.queued}`), "success");
      setTitle("");
      setMessage("");
      setButtonText("");
      setButtonUrl("");
      setPreviewCount(null);
      setPreviewPayload(null);
    } catch (e) {
      onNotify(textError(e, tx("Не удалось запустить рассылку", "Failed to start campaign")), "error");
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = campaignTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setTitle(template.title);
    setMessage(template.message);
    setButtonText("");
    setButtonUrl("");
    onNotify(tx("Шаблон применен", "Template applied"), "info");
  };

  const onSendDigest = async (period: ReportPeriod) => {
    if (!window.confirm(tx("Подтвердить отправку digest Premium/VIP?", "Confirm Premium/VIP digest send?"))) return;
    setSendingPeriod(period);
    try {
      const result = await api.adminReportDigestSend({ period, force_send: true, access_level: digestAccess });
      setDigestResult(result);
      onNotify(
        tx(
          `Digest отправлен: ${result.queued} (Premium ${result.queued_premium}, VIP ${result.queued_vip})`,
          `Digest queued: ${result.queued} (Premium ${result.queued_premium}, VIP ${result.queued_vip})`,
        ),
        "success",
      );
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось отправить digest", "Failed to send digest")), "error");
    } finally {
      setSendingPeriod(null);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <span className="admin-count-chip">{previewCount ?? "-"}</span>
        </div>
        <div className="admin-control-grid">
          <select value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="all">{tx("Все пользователи", "All users")}</option>
            <option value="free">{tx("Только free", "Free only")}</option>
            <option value="premium">{tx("Только Premium", "Premium only")}</option>
            <option value="vip">{tx("Только VIP", "VIP only")}</option>
            <option value="active_subscription">{tx("С активной подпиской", "Active subscription")}</option>
            <option value="admin">{tx("Только админы", "Admins only")}</option>
            <option value="notifications_enabled">{tx("Только с уведомлениями", "Notifications enabled")}</option>
          </select>
          <select value={access} onChange={(e) => setAccess(e.target.value)}>
            <option value="all">{tx("Любой доступ", "Any access")}</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      <div className="card-lite admin-report-digest-card">
        <p className="stacked"><b>{tx("Авто-отчеты по прогнозам (ручной запуск)", "Auto forecast reports (manual send)")}</b></p>
        <p className="stacked muted">
          {tx(
            "Запускает ту же автоматическую статистику, но по кнопке вручную. Учитываются пользовательские настройки digest-уведомлений.",
            "Runs the same automatic statistics manually on click. User digest notification settings are respected.",
          )}
        </p>
        <div className="admin-control-grid admin-report-digest-filter">
          <select value={digestAccess} onChange={(e) => setDigestAccess(e.target.value as ReportDigestAccess)}>
            <option value="all">{tx("Premium + VIP", "Premium + VIP")}</option>
            <option value="premium">{tx("Только Premium", "Premium only")}</option>
            <option value="vip">{tx("Только VIP", "VIP only")}</option>
          </select>
        </div>
        <div className="admin-quick-actions three admin-report-digest-actions">
          {(["daily", "weekly", "monthly"] as ReportPeriod[]).map((period) => (
            <button
              key={period}
              className={period === "monthly" ? "btn ghost" : "btn"}
              type="button"
              disabled={sendingPeriod !== null}
              onClick={() => void onSendDigest(period)}
            >
              {sendingPeriod === period ? tx("Отправка...", "Sending...") : reportPeriodLabel(period, language)}
            </button>
          ))}
        </div>
        {digestResult ? (
          <p className="muted stacked">
            {tx("Последний запуск", "Latest send")}: {reportPeriodLabel(digestResult.period as ReportPeriod, language)} •
            {" "}{tx("доступ", "access")} {reportAccessLabel(digestResult.access_level, language)} •
            {" "}{tx("в очереди", "queued")} {digestResult.queued} • Premium {digestResult.queued_premium} • VIP {digestResult.queued_vip} •
            {" "}{tx("пропущено", "skipped")} {digestResult.skipped}
          </p>
        ) : null}
      </div>

      <div className="card-lite admin-report-digest-card">
        <p className="stacked"><b>{tx("Быстрые шаблоны рассылки", "Quick campaign templates")}</b></p>
        <div className="admin-quick-actions three admin-report-digest-actions">
          {campaignTemplates.map((template) => (
            <button key={template.id} className="btn ghost" type="button" onClick={() => applyTemplate(template.id)}>
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-form admin-broadcast-form admin-broadcast-compact">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tx("Заголовок рассылки", "Campaign title")} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={tx("Текст сообщения", "Message text")} />

        <label className="switch-row" style={{ padding: "0 4px" }}>
          <span>{tx("Только с включенными уведомлениями", "Notifications enabled only")}</span>
          <input type="checkbox" checked={notifOnly} onChange={(e) => setNotifOnly(e.target.checked)} />
        </label>

        <details className="admin-collapsible inline">
          <summary>{tx("Кнопка в сообщении (опционально)", "Message button (optional)")}</summary>
          <div className="admin-grid-2">
            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder={tx("Текст кнопки", "Button text")} />
            <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder={tx("Ссылка кнопки https://...", "Button URL https://...")} />
          </div>
        </details>

        <div className="admin-quick-actions three">
          <button className="btn ghost" type="button" onClick={() => void onPreview()}>
            {tx("Превью аудитории", "Audience preview")}
          </button>
          <button className="btn" type="button" onClick={() => void onSend()}>
            {tx("Отправить рассылку", "Send campaign")}
          </button>
        </div>

        {previewCount !== null ? <p className="muted">{tx("Получателей", "Recipients")}: {previewCount}</p> : null}
        {previewPayload ? (
          <div className="card-lite">
            <p className="stacked"><b>{tx("Предпросмотр", "Preview")}</b></p>
            <p className="stacked"><b>{previewPayload.title || tx("Без заголовка", "No title")}</b></p>
            <p className="stacked">{previewPayload.message || ""}</p>
            {previewPayload.button_text && previewPayload.button_url ? (
              <p className="stacked">{tx("Кнопка", "Button")}: <b>{previewPayload.button_text}</b> ({previewPayload.button_url})</p>
            ) : (
              <p className="stacked muted">{tx("Без кнопки", "No button")}</p>
            )}
          </div>
        ) : null}
        {deliveryStats ? (
          <p className="muted">
            {tx("Доставка", "Delivery")}: {tx("всего", "total")} {deliveryStats.total} • {tx("отправлено", "sent")} {deliveryStats.sent} • {tx("ошибок", "failed")} {deliveryStats.failed} • {tx("в очереди", "queued")} {deliveryStats.queued}
          </p>
        ) : null}
      </div>
    </div>
  );
}
