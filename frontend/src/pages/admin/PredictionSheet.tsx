import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../services/api";
import { BottomSheet } from "./BottomSheet";
import {
  buildTimePresets,
  buildUniqueSuggestions,
  composePredictionDescription,
  createEmptyPredictionDraft,
  createPredictionDraftFromItem,
  fileToDataUrl,
  SPORT_TEMPLATES,
  TAG_DEFS,
  tagLabel,
  textError,
  type Language,
  type Prediction,
  type PredictionDraft,
} from "./shared";

const DRAFT_STORAGE_KEY = "pitbet_admin_prediction_draft_v1";

type PredictionSheetProps = {
  open: boolean;
  mode: "create" | "edit";
  editingId: string | null;
  language: Language;
  /** Прогнозы из ленты — для подсказок матча/лиги/сигнала */
  allPredictions: Prediction[];
  /** Исходный прогноз при редактировании */
  source?: Prediction | null;
  /** Прогноз-источник для дублирования (режим create) */
  duplicateFrom?: Prediction | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (text: string) => void;
};

export function PredictionSheet({
  open,
  mode,
  editingId,
  language,
  allPredictions,
  source,
  duplicateFrom,
  onClose,
  onSaved,
  onError,
}: PredictionSheetProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);

  const [draft, setDraft] = useState<PredictionDraft>(createEmptyPredictionDraft());
  const [saving, setSaving] = useState(false);
  const [sportCustomMode, setSportCustomMode] = useState(false);
  const hydratedRef = useRef(false);

  // Гидрируем драфт при открытии
  useEffect(() => {
    if (!open) {
      hydratedRef.current = false;
      return;
    }
    if (mode === "edit" && source) {
      setDraft(createPredictionDraftFromItem(source));
      hydratedRef.current = true;
      return;
    }
    if (mode === "create" && duplicateFrom) {
      // Дублирование: берём поля источника, но сбрасываем результат
      const dup = createPredictionDraftFromItem(duplicateFrom);
      dup.status = "pending";
      dup.result_screenshot = null;
      dup.notify_subscribers = true;
      setDraft(dup);
      hydratedRef.current = true;
      return;
    }
    // обычный create: пробуем восстановить несохранённый драфт
    if (mode === "create" && !hydratedRef.current) {
      const stored = readStoredDraft();
      setDraft(stored ?? createEmptyPredictionDraft());
      hydratedRef.current = true;
    }
  }, [open, mode, source, duplicateFrom]);

  // Автосохранение драфта в localStorage (только в режиме create)
  useEffect(() => {
    if (!open || mode !== "create") return;
    const hasContent = draft.match_name.trim() || draft.brief.trim() || draft.breakdown.trim();
    if (!hasContent) return;
    writeStoredDraft(draft);
  }, [draft, open, mode]);

  const matchSuggestions = useMemo(() => buildUniqueSuggestions(allPredictions.map((p) => p.match_name), 30), [allPredictions]);
  const leagueSuggestions = useMemo(() => buildUniqueSuggestions(allPredictions.map((p) => p.league), 20), [allPredictions]);
  const signalSuggestions = useMemo(() => buildUniqueSuggestions(allPredictions.map((p) => p.signal_type), 20), [allPredictions]);
  const timePresets = useMemo(() => buildTimePresets(), []);

  const update = <K extends keyof PredictionDraft>(key: K, value: PredictionDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onScreenshotPick = async (field: "bet_screenshot" | "result_screenshot", file: File) => {
    if (!file.type.startsWith("image/")) {
      onError(tx("Нужен файл изображения", "Please upload an image file"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      onError(tx("Скрин слишком большой (максимум 4MB)", "Image is too large (max 4MB)"));
      return;
    }
    try {
      const payload = await fileToDataUrl(file);
      update(field, payload);
    } catch {
      onError(tx("Не удалось прочитать файл", "Failed to read file"));
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const matchName = draft.match_name.trim();
    const signalType = draft.signal_type.trim();
    const eventStart = draft.event_start_at.trim();
    const odds = Number(draft.odds);

    if (!matchName || !signalType || !eventStart || !Number.isFinite(odds) || odds <= 1) {
      onError(tx("Заполните обязательные поля прогноза", "Fill required prediction fields"));
      return;
    }

    const description = composePredictionDescription(draft, language);
    const betScreenshot = draft.bet_screenshot && draft.bet_screenshot.trim() ? draft.bet_screenshot : null;
    const resultScreenshot = draft.result_screenshot && draft.result_screenshot.trim() ? draft.result_screenshot : null;

    const payload = {
      title: draft.title.trim() || `${matchName} • ${signalType}`,
      match_name: matchName,
      league: draft.league.trim() || null,
      sport_type: draft.sport_type.trim() || "football",
      event_start_at: eventStart,
      signal_type: signalType,
      odds,
      short_description: description,
      bet_screenshot: mode === "edit" ? betScreenshot || "" : betScreenshot,
      result_screenshot: mode === "edit" ? resultScreenshot || "" : resultScreenshot,
      risk_level: draft.risk_level,
      access_level: draft.access_level,
      mode: draft.mode,
      status: draft.status,
      publish_now: true,
      notify_subscribers: draft.notify_subscribers,
    };

    setSaving(true);
    try {
      if (mode === "create") {
        await api.adminCreatePrediction(payload);
      } else if (mode === "edit" && editingId) {
        await api.adminUpdatePrediction(editingId, payload);
      }
      clearStoredDraft();
      hydratedRef.current = false;
      onSaved();
    } catch (err) {
      onError(textError(err, tx("Не удалось сохранить прогноз", "Failed to save prediction")));
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "create" ? tx("Новый прогноз", "New prediction") : tx("Редактирование прогноза", "Edit prediction");

  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <form className="admin-sheet-form" onSubmit={onSubmit}>
        {/* --- Событие --- */}
        <section className="admin-editor-section">
          <h4 className="admin-section-title">
            <span className="emoji">📌</span>
            {tx("Событие", "Event")}
          </h4>

          <div>
            <span className="admin-field-label">{tx("Матч", "Match")} *</span>
            <input
              value={draft.match_name}
              list="pred-match-list"
              onChange={(e) => update("match_name", e.target.value)}
              placeholder={tx("Команда А — Команда Б", "Team A — Team B")}
              required
              autoFocus={mode === "create"}
            />
            <datalist id="pred-match-list">
              {matchSuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>

          <div className="admin-grid-2">
            <div>
              <span className="admin-field-label">{tx("Лига", "League")}</span>
              <input value={draft.league} list="pred-league-list" onChange={(e) => update("league", e.target.value)} placeholder={tx("Лига", "League")} />
              <datalist id="pred-league-list">
                {leagueSuggestions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <div>
              <span className="admin-field-label">{tx("Начало", "Start")} *</span>
              <input type="datetime-local" value={draft.event_start_at} onChange={(e) => update("event_start_at", e.target.value)} required />
            </div>
          </div>

          {/* Чипы быстрого времени */}
          <div className="admin-time-presets">
            {timePresets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className="admin-time-preset"
                onClick={() => update("event_start_at", preset.apply())}
              >
                {isRu ? preset.ru : preset.en}
              </button>
            ))}
          </div>
        </section>

        {/* --- Вид спорта (шаблоны) --- */}
        <section className="admin-editor-section">
          <h4 className="admin-section-title">
            <span className="emoji">🏆</span>
            {tx("Вид спорта", "Sport")}
          </h4>
          <div className="admin-sport-select-wrap">
            <select
              className="admin-sport-select"
              value={SPORT_TEMPLATES.some((t) => t.code === draft.sport_type) ? draft.sport_type : "__custom"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__custom") {
                  // переключаемся в режим ручного ввода
                  update("sport_type", draft.sport_type || "");
                  setSportCustomMode(true);
                } else {
                  update("sport_type", val);
                  setSportCustomMode(false);
                }
              }}
            >
              {SPORT_TEMPLATES.map((tpl) => (
                <option key={tpl.code} value={tpl.code}>
                  {tpl.emoji}  {isRu ? tpl.ru : tpl.en}
                </option>
              ))}
              <option value="__custom">{isRu ? "✏️  Другой (ввести вручную)" : "✏️  Other (manual)"}</option>
            </select>
            {sportCustomMode ? (
              <input
                className="admin-sport-custom-input"
                value={draft.sport_type}
                onChange={(e) => update("sport_type", e.target.value)}
                placeholder={tx("Введите вид спорта", "Enter sport")}
              />
            ) : null}
          </div>
        </section>

        {/* --- Ставка --- */}
        <section className="admin-editor-section">
          <h4 className="admin-section-title">
            <span className="emoji">🎯</span>
            {tx("Ставка", "Pick")}
          </h4>

          <input
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder={tx("Заголовок (опционально)", "Title (optional)")}
          />

          <div className="admin-grid-3">
            <div>
              <span className="admin-field-label">{tx("Доступ", "Access")}</span>
              <select value={draft.access_level} onChange={(e) => update("access_level", e.target.value as PredictionDraft["access_level"])}>
                <option value="free">{tx("Бесплатный", "Free")}</option>
                <option value="premium">{tx("Премиум", "Premium")}</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <span className="admin-field-label">{tx("Коэффициент", "Odds")}</span>
              <input type="number" min="1.01" step="0.01" value={draft.odds} onChange={(e) => update("odds", e.target.value)} placeholder="1.80" />
            </div>
            <div>
              <span className="admin-field-label">{tx("Риск", "Risk")}</span>
              <select value={draft.risk_level} onChange={(e) => update("risk_level", e.target.value as PredictionDraft["risk_level"])}>
                <option value="low">{tx("Низкий", "Low")}</option>
                <option value="medium">{tx("Средний", "Medium")}</option>
                <option value="high">{tx("Высокий", "High")}</option>
              </select>
            </div>
          </div>

          <div className="admin-grid-2">
            <div>
              <span className="admin-field-label">{tx("Тип сигнала", "Signal type")} *</span>
              <input
                value={draft.signal_type}
                list="pred-signal-list"
                onChange={(e) => update("signal_type", e.target.value)}
                placeholder={tx("П1, ТБ 2.5, Ф1(-1)...", "W1, O 2.5, AH1(-1)...")}
                required
              />
              <datalist id="pred-signal-list">
                {signalSuggestions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <div>
              <span className="admin-field-label">{tx("Режим", "Mode")}</span>
              <select value={draft.mode} onChange={(e) => update("mode", e.target.value as PredictionDraft["mode"])}>
                <option value="prematch">{tx("Прематч", "Prematch")}</option>
                <option value="live">{tx("Лайв", "Live")}</option>
              </select>
            </div>
          </div>

          {/* Теги — всегда на русском */}
          <div className="admin-chip-toggle-row">
            {TAG_DEFS.map((def) => {
              const field = def.key === "pick" ? "tag_pick" : def.key === "strong" ? "tag_strong" : "tag_hot";
              const active = draft[field];
              return (
                <label key={def.key} className={active ? "admin-chip-toggle active" : "admin-chip-toggle"}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => update(field, e.target.checked)}
                  />
                  {tagLabel(def.key, language)}
                </label>
              );
            })}
          </div>
        </section>

        {/* --- Статус и уведомление --- */}
        <section className="admin-editor-section">
          <h4 className="admin-section-title">
            <span className="emoji">📊</span>
            {tx("Статус и результат", "Status and result")}
          </h4>
          <div className="admin-status-switch">
            <button className={draft.status === "pending" ? "active" : ""} type="button" onClick={() => update("status", "pending")}>
              {tx("В ожидании", "Pending")}
            </button>
            <button className={draft.status === "won" ? "active" : ""} type="button" onClick={() => update("status", "won")}>
              {tx("Выигрыш", "Won")}
            </button>
            <button className={draft.status === "lost" ? "active" : ""} type="button" onClick={() => update("status", "lost")}>
              {tx("Проигрыш", "Lost")}
            </button>
            <button className={draft.status === "refund" ? "active" : ""} type="button" onClick={() => update("status", "refund")}>
              {tx("Возврат", "Refund")}
            </button>
          </div>
          <label className="switch-row" style={{ padding: "0 4px" }}>
            <span>{tx("Отправить уведомление подписчикам", "Notify subscribers")}</span>
            <input type="checkbox" checked={draft.notify_subscribers} onChange={(e) => update("notify_subscribers", e.target.checked)} />
          </label>
        </section>

        {/* --- Разбор --- */}
        <section className="admin-editor-section">
          <h4 className="admin-section-title">
            <span className="emoji">📝</span>
            {tx("Разбор", "Breakdown")}
          </h4>
          <textarea value={draft.brief} onChange={(e) => update("brief", e.target.value)} rows={3} placeholder={tx("Краткий текст", "Brief text")} />
          <textarea value={draft.breakdown} onChange={(e) => update("breakdown", e.target.value)} rows={4} placeholder={tx("Полный разбор", "Full breakdown")} />
          <textarea value={draft.comments} onChange={(e) => update("comments", e.target.value)} rows={3} placeholder={tx("Комментарии", "Comments")} />
        </section>

        {/* --- Скрины --- */}
        <section className="admin-editor-section">
          <h4 className="admin-section-title">
            <span className="emoji">🖼</span>
            {tx("Скрины", "Screenshots")}
          </h4>

          <ScreenshotBlock
            label={tx("Скрин ставки", "Bet screenshot")}
            emptyText={tx("Скрин ставки не добавлен", "No bet screenshot")}
            value={draft.bet_screenshot}
            onPick={(file) => onScreenshotPick("bet_screenshot", file)}
            onClear={() => update("bet_screenshot", null)}
            language={language}
          />

          <ScreenshotBlock
            label={tx("Скрин результата", "Result screenshot")}
            emptyText={tx("Скрин результата не добавлен", "No result screenshot")}
            value={draft.result_screenshot}
            onPick={(file) => onScreenshotPick("result_screenshot", file)}
            onClear={() => update("result_screenshot", null)}
            language={language}
          />
        </section>

        <div className="admin-sheet-footer">
          <button className="btn ghost" type="button" onClick={onClose}>
            {tx("Отмена", "Cancel")}
          </button>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="admin-mini-spin" />
                {tx("Сохраняем...", "Saving...")}
              </>
            ) : (
              tx("Сохранить", "Save")
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

type ScreenshotBlockProps = {
  label: string;
  emptyText: string;
  value: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  language: Language;
};

function ScreenshotBlock({ label, emptyText, value, onPick, onClear, language }: ScreenshotBlockProps) {
  const isRu = language === "ru";
  const tx = (ru: string, en: string) => (isRu ? ru : en);
  return (
    <div className="admin-shot-block">
      <strong>{label}</strong>
      {value ? (
        <div className="admin-image-preview compact">
          <img src={value} alt={label} loading="lazy" />
        </div>
      ) : (
        <p className="muted">{emptyText}</p>
      )}
      <div className="admin-shot-actions-row">
        <label className="btn ghost admin-file-btn">
          {value ? tx("Заменить", "Replace") : tx("Загрузить", "Upload")}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (!file) return;
              onPick(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <button className="btn ghost" type="button" disabled={!value} onClick={onClear}>
          {tx("Удалить", "Delete")}
        </button>
      </div>
    </div>
  );
}

/* ----- localStorage драфт ----- */

function readStoredDraft(): PredictionDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PredictionDraft;
    if (!parsed || typeof parsed !== "object") return null;
    return { ...createEmptyPredictionDraft(), ...parsed };
  } catch {
    return null;
  }
}

function writeStoredDraft(draft: PredictionDraft) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* localStorage может быть недоступен — игнорируем */
  }
}

function clearStoredDraft() {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
