import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ActivityBand, AppShellSection, SectionHeader, StatusPill } from "../components/ui";
import {
  api,
  type Me,
  type SupportActionLog,
  type SupportDialogDetail,
  type SupportDialogPreview,
  type SupportDialogStatus,
} from "../services/api";

type DialogStatusFilter = SupportDialogStatus | "all";

function formatDate(value: string | null, language: "ru" | "en"): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function statusLabel(status: SupportDialogStatus, t: (key: string) => string): string {
  if (status === "waiting_user") return t("support.status.waitingUser");
  if (status === "waiting_support") return t("support.status.waitingSupport");
  if (status === "closed") return t("support.status.closed");
  return t("support.status.open");
}

function logLabel(actionType: string, t: (key: string) => string): string {
  if (actionType === "support_message_sent") return t("support.log.supportMessageSent");
  if (actionType === "dialog_status_changed") return t("support.log.dialogStatusChanged");
  if (actionType === "dialog_closed") return t("support.log.dialogClosed");
  if (actionType === "dialog_reopened") return t("support.log.dialogReopened");
  if (actionType === "dialog_opened") return t("support.log.dialogOpened");
  if (actionType === "support_role_granted") return t("support.log.supportRoleGranted");
  if (actionType === "support_role_revoked") return t("support.log.supportRoleRevoked");
  if (actionType === "user_message_sent") return t("support.log.userMessageSent");
  return actionType;
}

function actorName(me: Me | null, item: SupportActionLog, t: (key: string) => string): string {
  if (item.actor_name) return item.actor_name;
  if (item.actor_role === "admin") return t("layout.role.admin");
  if (item.actor_role === "support") return t("layout.role.support");
  if (item.actor_role === "user") return t("support.common.user");
  if (!item.actor_role && !item.actor_user_id) return t("support.common.system");
  if (me && item.actor_user_id && me.id === item.actor_user_id) return t("support.common.you");
  return t("support.common.unknown");
}

function topicLabel(topic: string | null | undefined, t: (key: string) => string): string {
  if (!topic) return t("support.user.topicUnset");
  if (topic === "payment") return t("support.topic.payment");
  if (topic === "subscription") return t("support.topic.subscription");
  if (topic === "technical") return t("support.topic.technical");
  if (topic === "other") return t("support.topic.other");
  return topic;
}

export function SupportInboxPage() {
  const { t, language } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [dialogs, setDialogs] = useState<SupportDialogPreview[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DialogStatusFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [selectedDialogId, setSelectedDialogId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportDialogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");

  const [logs, setLogs] = useState<SupportActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const isAdmin = me?.role === "admin";
  const isStaff = me?.role === "admin" || me?.role === "support";

  const loadDialogs = async () => {
    if (!isStaff) return;
    setListLoading(true);
    try {
      const items = await api.supportDialogs({
        q: query.trim() || undefined,
        status: statusFilter,
        unread_only: unreadOnly,
        limit: 200,
      });
      setDialogs(items);
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("support.inbox.loadFailed")) });
    } finally {
      setListLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!isAdmin) return;
    setLogsLoading(true);
    try {
      const rows = await api.supportLogs({ limit: 50 });
      setLogs(rows);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const openDialog = async (dialogId: string) => {
    setSelectedDialogId(dialogId);
    setDetailLoading(true);
    setNotice(null);
    try {
      const payload = await api.supportDialog(dialogId);
      setDetail(payload);
      setReplyText("");
      await loadDialogs();
      await loadLogs();
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("support.inbox.openFailed")) });
    } finally {
      setDetailLoading(false);
    }
  };

  const onReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDialogId || !replyText.trim()) return;

    setBusy(true);
    setNotice(null);
    try {
      const payload = await api.supportReplyToDialog(selectedDialogId, { body: replyText.trim() });
      setDetail(payload);
      setReplyText("");
      setNotice({ tone: "success", text: t("support.inbox.replySent") });
      await loadDialogs();
      await loadLogs();
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("support.inbox.replyFailed")) });
    } finally {
      setBusy(false);
    }
  };

  const onStatusChange = async (status: SupportDialogStatus) => {
    if (!selectedDialogId) return;

    setBusy(true);
    setNotice(null);
    try {
      const payload = await api.supportUpdateDialogStatus(selectedDialogId, status);
      setDetail(payload);
      setNotice({ tone: "success", text: t("support.inbox.statusUpdated") });
      await loadDialogs();
      await loadLogs();
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("support.inbox.statusFailed")) });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const boot = async () => {
      try {
        const profile = await api.me();
        if (!alive) return;
        setMe(profile);
      } finally {
        if (!alive) return;
        setCheckingAccess(false);
      }
    };
    void boot();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (checkingAccess || !isStaff) return;
    void loadDialogs();
  }, [checkingAccess, isStaff, query, statusFilter, unreadOnly]);

  const sortedDialogs = useMemo(
    () => [...dialogs].sort((a, b) => (new Date(b.last_message_at || b.updated_at).getTime() || 0) - (new Date(a.last_message_at || a.updated_at).getTime() || 0)),
    [dialogs],
  );
  const openedDialog = detail?.dialog || null;

  if (checkingAccess) {
    return (
      <Layout>
        <AppShellSection>
          <p className="pb-empty-state">{t("support.inbox.checkingAccess")}</p>
        </AppShellSection>
        <AppDisclaimer />
      </Layout>
    );
  }

  if (!isStaff) {
    return (
      <Layout>
        <AppShellSection>
          <SectionHeader title={t("support.inbox.title")} subtitle={t("support.inbox.subtitle")} />
          <p className="pb-empty-state">{t("support.inbox.accessDenied")}</p>
        </AppShellSection>
        <AppDisclaimer />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <StatusPill label={isAdmin ? t("layout.role.admin") : t("layout.role.support")} tone="accent" />
        </div>
        <h2>{t("support.inbox.title")}</h2>
        <p>{t("support.inbox.subtitle")}</p>
        <ActivityBand
          items={[
            { label: t("support.inbox.listTitle"), value: sortedDialogs.length, tone: "accent" },
            { label: t("support.inbox.filter.unread"), value: sortedDialogs.filter((item) => item.unread_for_staff > 0).length, tone: "warning" },
            { label: t("layout.role.support"), value: isAdmin ? t("layout.role.admin") : t("layout.role.support") },
          ]}
        />
      </section>

      {selectedDialogId && detail && openedDialog ? (
        <>
          <AppShellSection>
            <SectionHeader
              title={openedDialog.user_first_name || openedDialog.user_username || String(openedDialog.user_telegram_id)}
              subtitle={`@${openedDialog.user_username || "-"} • tg ${openedDialog.user_telegram_id}`}
              action={
                <button
                  className="pb-btn pb-btn-ghost"
                  type="button"
                  onClick={() => {
                    setSelectedDialogId(null);
                    setDetail(null);
                    setLogs([]);
                  }}
                >
                  {t("support.inbox.back")}
                </button>
              }
            />
            <div className="pb-support-dialog-meta">
              <span className="pb-status-pill accent">{statusLabel(openedDialog.status, t)}</span>
              <span className="pb-support-subject">{topicLabel(openedDialog.subject, t)}</span>
            </div>

            <div className="pb-support-thread" role="log" aria-live="polite">
              {detail.messages.map((item) => {
                const fromUser = item.sender_role === "user";
                return (
                  <article key={item.id} className={fromUser ? "pb-support-message user" : "pb-support-message staff"}>
                    <div className="pb-support-message-head">
                      <strong>{item.sender_name}</strong>
                      <span>{formatDate(item.created_at, language)}</span>
                    </div>
                    <p>{item.body}</p>
                  </article>
                );
              })}
            </div>
          </AppShellSection>

          <AppShellSection>
            <SectionHeader title={t("support.inbox.replyTitle")} />
            <form className="pb-support-reply-box" onSubmit={onReply}>
              <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={4} placeholder={t("support.inbox.replyPlaceholder")} />
              <div className="pb-support-reply-actions">
                <button className="pb-btn pb-btn-ghost" type="button" onClick={() => void openDialog(selectedDialogId)} disabled={busy || detailLoading}>
                  {t("support.user.refresh")}
                </button>
                <button className="pb-btn pb-btn-primary" type="submit" disabled={busy || !replyText.trim()}>
                  {busy ? t("support.inbox.sending") : t("support.inbox.send")}
                </button>
              </div>
            </form>

            <div className="pb-support-status-actions">
              {(["open", "waiting_support", "waiting_user", "closed"] as const).map((status) => (
                <button key={status} className={openedDialog.status === status ? "active" : ""} type="button" onClick={() => void onStatusChange(status)} disabled={busy}>
                  {statusLabel(status, t)}
                </button>
              ))}
            </div>
            {notice ? <p className={notice.tone === "success" ? "pb-notice success" : "pb-notice error"}>{notice.text}</p> : null}
          </AppShellSection>

          <AppShellSection>
            <SectionHeader title={t("support.inbox.contextTitle")} />
            <div className="pb-support-context-grid">
              <div>
                <span>{t("profile.snapshot.tariff")}</span>
                <strong>{detail.context?.subscription.tariff || "free"}</strong>
              </div>
              <div>
                <span>{t("profile.snapshot.status")}</span>
                <strong>{detail.context?.subscription.status || "inactive"}</strong>
              </div>
              <div>
                <span>{t("profile.hero.accessUntil")}</span>
                <strong>{formatDate(detail.context?.subscription.ends_at || null, language)}</strong>
              </div>
            </div>

            <div className="pb-support-payment-list">
              <h3>{t("support.inbox.recentPayments")}</h3>
              {detail.context?.recent_payments.length ? (
                detail.context.recent_payments.map((item) => (
                  <article key={item.id} className="pb-support-payment-card">
                    <strong>
                      {item.amount_rub} RUB • {item.access_level}
                    </strong>
                    <p>
                      {item.status} • {item.duration_days} {t("common.days")}
                    </p>
                    <small>
                      {formatDate(item.created_at, language)} • {item.method_name || t("common.notAvailable")}
                    </small>
                    {item.review_comment ? <p>{item.review_comment}</p> : null}
                  </article>
                ))
              ) : (
                <p className="pb-empty-state">{t("support.inbox.noPayments")}</p>
              )}
            </div>
          </AppShellSection>

          {isAdmin ? (
            <AppShellSection>
              <SectionHeader title={t("support.inbox.logsTitle")} />
              {logsLoading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}
              {!logsLoading && logs.length === 0 ? <p className="pb-empty-state">{t("support.inbox.noLogs")}</p> : null}
              {!logsLoading && logs.length > 0 ? (
                <div className="pb-support-log-list">
                  {logs.map((item) => (
                    <article key={item.id} className="pb-support-log-item">
                      <strong>{logLabel(item.action_type, t)}</strong>
                      <p>
                        {actorName(me, item, t)} • {formatDate(item.created_at, language)}
                      </p>
                      <small>
                        {item.dialog_id ? `dialog ${item.dialog_id}` : "-"}
                        {item.target_name ? ` • ${item.target_name}` : ""}
                      </small>
                      {item.meta ? <small>{JSON.stringify(item.meta)}</small> : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </AppShellSection>
          ) : null}
        </>
      ) : (
        <AppShellSection>
          <SectionHeader title={t("support.inbox.listTitle")} subtitle={t("support.inbox.listSubtitle")} />

          <div className="pb-support-filters">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("support.inbox.searchPlaceholder")} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DialogStatusFilter)}>
              <option value="all">{t("support.inbox.filter.all")}</option>
              <option value="open">{statusLabel("open", t)}</option>
              <option value="waiting_support">{statusLabel("waiting_support", t)}</option>
              <option value="waiting_user">{statusLabel("waiting_user", t)}</option>
              <option value="closed">{statusLabel("closed", t)}</option>
            </select>
            <label className="pb-support-unread-toggle">
              <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
              <span>{t("support.inbox.filter.unread")}</span>
            </label>
            <button className="pb-btn pb-btn-ghost" type="button" onClick={() => void loadDialogs()} disabled={listLoading}>
              {t("support.user.refresh")}
            </button>
          </div>

          {notice ? <p className={notice.tone === "success" ? "pb-notice success" : "pb-notice error"}>{notice.text}</p> : null}
          {listLoading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}
          {!listLoading && sortedDialogs.length === 0 ? <p className="pb-empty-state">{t("support.inbox.empty")}</p> : null}

          <div className="pb-support-dialog-list">
            {sortedDialogs.map((item) => (
              <button key={item.id} type="button" className="pb-support-dialog-card" onClick={() => void openDialog(item.id)}>
                <div className="pb-support-dialog-top">
                  <strong>{item.user_first_name || item.user_username || String(item.user_telegram_id)}</strong>
                  <span className={`pb-status-pill ${item.status === "closed" ? "warning" : "accent"}`}>{statusLabel(item.status, t)}</span>
                </div>
                <p className="pb-support-dialog-meta">
                  @{item.user_username || "-"} • tg {item.user_telegram_id}
                </p>
                {item.subject ? <p className="pb-support-dialog-topic">{topicLabel(item.subject, t)}</p> : null}
                <p className="pb-support-dialog-preview">{item.last_message_preview || t("support.inbox.noPreview")}</p>
                <div className="pb-support-dialog-foot">
                  <small>{formatDate(item.last_message_at || item.updated_at, language)}</small>
                  <small>{item.last_message_by_name || t("support.common.unknown")}</small>
                  {item.unread_for_staff > 0 ? <em>{item.unread_for_staff}</em> : null}
                </div>
              </button>
            ))}
          </div>
        </AppShellSection>
      )}

      <AppDisclaimer />
    </Layout>
  );
}
