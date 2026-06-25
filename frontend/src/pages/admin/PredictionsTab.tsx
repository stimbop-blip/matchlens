import { useEffect, useMemo, useState } from "react";

import { api } from "../../services/api";
import { triggerHaptic } from "../../services/telegram";
import {
  accessLabel,
  fileToDataUrl,
  formatDateTime,
  statusLabel,
  tagLabel,
  TAG_DEFS,
  tagsFromDescription,
  textError,
  type Language,
  type Prediction,
  type PredictionStatusFilter,
  type AccessFilter,
} from "./shared";
import { PredictionSheet } from "./PredictionSheet";

type PredictionsTabProps = {
  language: Language;
  predictions: Prediction[];
  loading: boolean;
  onRefresh: () => void;
  onReload: () => void;
  onNotify: (text: string, tone: "success" | "error" | "info") => void;
  autoCreateSignal?: number;
};

export function PredictionsTab({ language, predictions, loading, onRefresh, onReload, onNotify, autoCreateSignal = 0 }: PredictionsTabProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PredictionStatusFilter>("all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");

  const [statusPanelId, setStatusPanelId] = useState<string | null>(null);
  const [screenshotPanelId, setScreenshotPanelId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [sheetMode, setSheetMode] = useState<"closed" | "create" | "edit">("closed");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetSource, setSheetSource] = useState<Prediction | null>(null);
  const [sheetDuplicate, setSheetDuplicate] = useState<Prediction | null>(null);

  // Открытие формы создания по сигналу с Dashboard
  useEffect(() => {
    if (autoCreateSignal > 0) {
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreateSignal]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return predictions.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (accessFilter !== "all" && item.access_level !== accessFilter) return false;
      if (!q) return true;
      const dateText = formatDateTime(item.event_start_at, isRu).toLowerCase();
      const base = `${item.match_name} ${item.title} ${item.league || ""} ${item.signal_type} ${item.sport_type} ${dateText}`.toLowerCase();
      return base.includes(q);
    });
  }, [predictions, query, statusFilter, accessFilter, isRu]);

  const openCreate = () => {
    setSheetSource(null);
    setSheetDuplicate(null);
    setSheetId(null);
    setSheetMode("create");
  };

  const openEdit = (item: Prediction) => {
    setSheetSource(item);
    setSheetDuplicate(null);
    setSheetId(item.id);
    setSheetMode("edit");
  };

  const openDuplicate = (item: Prediction) => {
    setSheetSource(null);
    setSheetDuplicate(item);
    setSheetId(null);
    setSheetMode("create");
    onNotify(tx("Прогноз скопирован — проверьте и опубликуйте", "Prediction duplicated — review and publish"), "info");
  };

  const closeSheet = () => {
    setSheetMode("closed");
    setSheetId(null);
    setSheetSource(null);
    setSheetDuplicate(null);
  };

  const onSaved = () => {
    const msg = sheetId ? tx("Прогноз обновлен", "Prediction updated") : tx("Прогноз создан", "Prediction created");
    onNotify(msg, "success");
    closeSheet();
    onReload();
  };

  const onUpdate = async (id: string, payload: Record<string, unknown>) => {
    try {
      await api.adminUpdatePrediction(id, payload);
      triggerHaptic("impact-light");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Ошибка обновления прогноза", "Failed to update prediction")), "error");
    }
  };

  const onQuickResult = async (id: string, status: "won" | "lost" | "refund") => {
    await onUpdate(id, { status });
    const label =
      status === "won" ? tx("Заход зафиксирован ✓", "Marked as won ✓") :
      status === "lost" ? tx("Проигрыш зафиксирован ✗", "Marked as lost ✗") :
      tx("Возврат зафиксирован", "Marked as refund");
    onNotify(label, status === "won" ? "success" : status === "lost" ? "error" : "info");
  };

  const onDelete = async (id: string) => {
    if (!window.confirm(tx("Удалить прогноз из ленты?", "Delete prediction from feed?"))) return;
    try {
      await api.adminDeletePrediction(id);
      onNotify(tx("Прогноз удален", "Prediction deleted"), "success");
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Ошибка удаления прогноза", "Failed to delete prediction")), "error");
    }
  };

  const onUploadScreenshot = async (id: string, field: "bet_screenshot" | "result_screenshot", file: File) => {
    if (!file.type.startsWith("image/")) {
      onNotify(tx("Нужен файл изображения", "Please upload an image file"), "error");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onNotify(tx("Скрин слишком большой (максимум 4MB)", "Image is too large (max 4MB)"), "error");
      return;
    }
    setUploadingId(`${id}:${field}`);
    try {
      const payload = await fileToDataUrl(file);
      await api.adminUpdatePrediction(id, { [field]: payload });
      onNotify(
        field === "bet_screenshot" ? tx("Скрин ставки сохранен", "Bet screenshot saved") : tx("Скрин результата сохранен", "Result screenshot saved"),
        "success",
      );
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось загрузить скрин", "Failed to upload screenshot")), "error");
    } finally {
      setUploadingId(null);
    }
  };

  const onClearScreenshot = async (id: string, field: "bet_screenshot" | "result_screenshot") => {
    try {
      await api.adminUpdatePrediction(id, { [field]: "" });
      onNotify(
        field === "bet_screenshot" ? tx("Скрин ставки удален", "Bet screenshot removed") : tx("Скрин результата удален", "Result screenshot removed"),
        "success",
      );
      onReload();
    } catch (e) {
      onNotify(textError(e, tx("Не удалось удалить скрин", "Failed to remove screenshot")), "error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-control-bar">
        <div className="admin-control-top">
          <button className="btn" type="button" onClick={openCreate}>
            {tx("Добавить прогноз", "Add prediction")}
          </button>
          <button className="btn ghost" type="button" onClick={onRefresh}>
            {tx("Обновить", "Refresh")}
          </button>
          <span className="admin-count-chip">{visible.length}</span>
        </div>
        <div className="admin-control-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Поиск: матч, спорт, дата", "Search: match, sport, date")} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PredictionStatusFilter)}>
            <option value="all">{tx("Все статусы", "All statuses")}</option>
            <option value="pending">{tx("В ожидании", "Pending")}</option>
            <option value="won">{tx("Выигрыш", "Won")}</option>
            <option value="lost">{tx("Проигрыш", "Lost")}</option>
            <option value="refund">{tx("Возврат", "Refund")}</option>
          </select>
          <select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}>
            <option value="all">{tx("Любой доступ", "Any access")}</option>
            <option value="free">{tx("Бесплатный", "Free")}</option>
            <option value="premium">{tx("Премиум", "Premium")}</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      <div className="admin-list admin-list-compact">
        {visible.map((item) => {
          const tags = tagsFromDescription(item.short_description);
          const activeTagKeys = TAG_DEFS.filter((def) => {
            const key = def.key === "pick" ? "pick" : def.key === "strong" ? "strong" : "hot";
            return tags[key];
          });
          return (
            <article key={item.id} className="prediction-card admin-item admin-card-compact">
              <div className="prediction-top admin-card-title-row">
                <strong>{item.match_name}</strong>
                <span className={`access-pill ${item.access_level}`}>{accessLabel(item.access_level, language)}</span>
              </div>
              <p className="muted admin-card-sub">
                {item.league || tx("Без лиги", "No league")} • {item.sport_type} • {formatDateTime(item.event_start_at, isRu)}
              </p>
              <div className="admin-meta-row">
                <span>{tx("кф", "odds")} {item.odds}</span>
                <span>{item.mode === "live" ? tx("Лайв", "Live") : tx("Прематч", "Prematch")}</span>
                <span>{item.signal_type}</span>
                <span className={`badge ${item.status}`}>{statusLabel(item.status, language)}</span>
              </div>

              {activeTagKeys.length > 0 ? (
                <div className="admin-tags-row">
                  {activeTagKeys.map((def) => (
                    <span key={def.key} className="admin-tag-pill">
                      {tagLabel(def.key, language)}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.bet_screenshot || item.result_screenshot ? (
                <div className="admin-mini-shot-grid">
                  {item.bet_screenshot ? (
                    <div className="admin-mini-shot-block">
                      <small>{tx("Ставка", "Bet")}</small>
                      <div className="admin-mini-shot">
                        <img src={item.bet_screenshot} alt={tx("Скрин ставки", "Bet screenshot")} loading="lazy" />
                      </div>
                    </div>
                  ) : null}
                  {item.result_screenshot ? (
                    <div className="admin-mini-shot-block">
                      <small>{tx("Результат", "Result")}</small>
                      <div className="admin-mini-shot">
                        <img src={item.result_screenshot} alt={tx("Скрин результата", "Result screenshot")} loading="lazy" />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Быстрое подтверждение результата для pending-прогнозов */}
              {item.status === "pending" ? (
                <>
                  <div className="admin-pending-banner">
                    <span>⏳</span>
                    {tx("Матч сыгран? Зафиксируйте результат в один тап", "Match finished? Set the result in one tap")}
                  </div>
                  <div className="admin-result-actions">
                    <button className="admin-result-btn win" type="button" onClick={() => void onQuickResult(item.id, "won")}>
                      <span className="emoji">✓</span>
                      {tx("Заход", "Won")}
                    </button>
                    <button className="admin-result-btn loss" type="button" onClick={() => void onQuickResult(item.id, "lost")}>
                      <span className="emoji">✗</span>
                      {tx("Мимо", "Lost")}
                    </button>
                    <button className="admin-result-btn refund" type="button" onClick={() => void onQuickResult(item.id, "refund")}>
                      <span className="emoji">↩</span>
                      {tx("Возврат", "Refund")}
                    </button>
                  </div>
                </>
              ) : null}

              <div className="admin-quick-actions">
                <button className="btn ghost" type="button" onClick={() => openEdit(item)}>
                  {tx("Изменить", "Edit")}
                </button>
                <button className="btn ghost" type="button" onClick={() => openDuplicate(item)}>
                  {tx("Копия", "Duplicate")}
                </button>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setScreenshotPanelId((prev) => (prev === item.id ? null : item.id))}
                >
                  {tx("Скрин", "Screenshot")}
                </button>
                <button className="btn danger" type="button" onClick={() => void onDelete(item.id)}>
                  {tx("Удалить", "Delete")}
                </button>
              </div>

              {/* Панель смены статуса (для непending) */}
              {item.status !== "pending" ? (
                <button
                  className="btn ghost"
                  type="button"
                  style={{ width: "100%" }}
                  onClick={() => setStatusPanelId((prev) => (prev === item.id ? null : item.id))}
                >
                  {tx("Изменить статус", "Change status")}
                </button>
              ) : null}

              {statusPanelId === item.id ? (
                <div className="admin-status-switch">
                  <button className={item.status === "pending" ? "active" : ""} type="button" onClick={() => void onUpdate(item.id, { status: "pending" })}>
                    {tx("В ожидании", "Pending")}
                  </button>
                  <button className={item.status === "won" ? "active" : ""} type="button" onClick={() => void onUpdate(item.id, { status: "won" })}>
                    {tx("Выигрыш", "Won")}
                  </button>
                  <button className={item.status === "lost" ? "active" : ""} type="button" onClick={() => void onUpdate(item.id, { status: "lost" })}>
                    {tx("Проигрыш", "Lost")}
                  </button>
                  <button className={item.status === "refund" ? "active" : ""} type="button" onClick={() => void onUpdate(item.id, { status: "refund" })}>
                    {tx("Возврат", "Refund")}
                  </button>
                </div>
              ) : null}

              {screenshotPanelId === item.id ? (
                <ScreenshotInline
                  item={item}
                  language={language}
                  uploadingId={uploadingId}
                  onUpload={onUploadScreenshot}
                  onClear={onClearScreenshot}
                />
              ) : null}
            </article>
          );
        })}
        {!loading && visible.length === 0 ? <p className="admin-empty">{tx("По текущим фильтрам прогнозов нет", "No predictions match current filters")}</p> : null}
      </div>

      <PredictionSheet
        open={sheetMode !== "closed"}
        mode={sheetMode === "closed" ? "create" : sheetMode}
        editingId={sheetId}
        source={sheetSource}
        duplicateFrom={sheetDuplicate}
        language={language}
        allPredictions={predictions}
        onClose={closeSheet}
        onSaved={onSaved}
        onError={(text) => onNotify(text, "error")}
      />
    </div>
  );
}

type ScreenshotInlineProps = {
  item: Prediction;
  language: Language;
  uploadingId: string | null;
  onUpload: (id: string, field: "bet_screenshot" | "result_screenshot", file: File) => void;
  onClear: (id: string, field: "bet_screenshot" | "result_screenshot") => void;
};

function ScreenshotInline({ item, language, uploadingId, onUpload, onClear }: ScreenshotInlineProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const renderBlock = (field: "bet_screenshot" | "result_screenshot", label: string) => {
    const value = item[field];
    return (
      <div className="admin-shot-block" key={field}>
        <strong>{label}</strong>
        {value ? (
          <div className="admin-image-preview compact">
            <img src={value} alt={label} loading="lazy" />
          </div>
        ) : (
          <p className="muted">{field === "bet_screenshot" ? tx("Скрин ставки не загружен", "No bet screenshot") : tx("Скрин результата не загружен", "No result screenshot")}</p>
        )}
        <div className="admin-shot-actions-row">
          <label className="btn ghost admin-file-btn">
            {uploadingId === `${item.id}:${field}` ? tx("Загрузка...", "Uploading...") : value ? tx("Заменить", "Replace") : tx("Загрузить", "Upload")}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;
                onUpload(item.id, field, file);
                e.currentTarget.value = "";
              }}
              disabled={uploadingId === `${item.id}:${field}`}
            />
          </label>
          <button className="btn ghost" type="button" disabled={!value} onClick={() => onClear(item.id, field)}>
            {tx("Удалить", "Delete")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-shot-panel">
      {renderBlock("bet_screenshot", tx("Скрин ставки", "Bet screenshot"))}
      {renderBlock("result_screenshot", tx("Скрин результата", "Result screenshot"))}
    </div>
  );
}
