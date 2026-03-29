import { type FormEvent, useEffect, useState } from "react";

import { useI18n } from "../app/i18n";
import { AppDisclaimer } from "../components/AppDisclaimer";
import { Layout } from "../components/Layout";
import { ActivityBand, AppShellSection, SectionHeader } from "../components/ui";
import { api, type SupportDialogDetail, type SupportDialogStatus } from "../services/api";

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

function statusLabel(status: SupportDialogStatus, t: (key: string) => string): string {
  if (status === "waiting_user") return t("support.status.waitingUser");
  if (status === "waiting_support") return t("support.status.waitingSupport");
  if (status === "closed") return t("support.status.closed");
  return t("support.status.open");
}

function parseError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function topicLabel(topic: string | null | undefined, t: (key: string) => string): string {
  if (!topic) return t("support.user.topicUnset");
  if (topic === "payment") return t("support.topic.payment");
  if (topic === "subscription") return t("support.topic.subscription");
  if (topic === "technical") return t("support.topic.technical");
  if (topic === "other") return t("support.topic.other");
  return topic;
}

const TOPIC_VALUES = ["payment", "subscription", "technical", "other"] as const;

export function SupportPage() {
  const { t, language } = useI18n();

  const [detail, setDetail] = useState<SupportDialogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [topic, setTopic] = useState<(typeof TOPIC_VALUES)[number]>("payment");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const loadDialog = async () => {
    setLoading(true);
    try {
      const payload = await api.mySupportDialog();
      setDetail(payload);
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("support.user.loadFailed")) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDialog();
  }, []);

  const onSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = messageText.trim();
    if (!body) return;

    setSending(true);
    setNotice(null);
    try {
      const canSetSubject = Boolean(!detail?.dialog?.subject);
      const next = await api.mySupportSendMessage({
        body,
        subject: canSetSubject ? topic : undefined,
      });
      setDetail(next);
      setMessageText("");
      setNotice({ tone: "success", text: t("support.user.sent") });
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("support.user.sendFailed")) });
    } finally {
      setSending(false);
    }
  };

  const dialog = detail?.dialog;
  const messages = detail?.messages || [];
  const canSetSubject = Boolean(!dialog?.subject);

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className={`pb-status-pill ${dialog?.status === "closed" ? "warning" : "accent"}`}>
            {statusLabel(dialog?.status || "open", t)}
          </span>
        </div>
        <h2>{t("support.user.title")}</h2>
        <p>{t("support.user.subtitle")}</p>
        <ActivityBand
          items={[
            { label: t("support.user.status"), value: statusLabel(dialog?.status || "open", t), tone: "accent" },
            { label: t("support.user.unread"), value: dialog?.unread_for_user ?? 0, tone: (dialog?.unread_for_user || 0) > 0 ? "warning" : "default" },
            { label: t("support.user.lastUpdate"), value: formatDate(dialog?.last_message_at || null, language) },
          ]}
        />
      </section>

      <AppShellSection>
        <SectionHeader title={t("support.user.threadTitle")} subtitle={t("support.user.threadSubtitle")} />

        {loading ? <p className="pb-empty-state">{t("common.loading")}</p> : null}
        {!loading && messages.length === 0 ? <p className="pb-empty-state">{t("support.user.empty")}</p> : null}

        {!loading && messages.length > 0 ? (
          <div className="pb-support-thread" role="log" aria-live="polite">
            {messages.map((item) => {
              const mine = item.sender_role === "user";
              return (
                <article key={item.id} className={mine ? "pb-support-message mine" : "pb-support-message staff"}>
                  <div className="pb-support-message-head">
                    <strong>{mine ? t("support.common.you") : item.sender_name}</strong>
                    <span>{formatDate(item.created_at, language)}</span>
                  </div>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
        ) : null}
      </AppShellSection>

      <AppShellSection>
        <SectionHeader title={t("support.user.replyTitle")} subtitle={topicLabel(dialog?.subject, t)} />
        <form className="pb-support-reply-box" onSubmit={onSend}>
          {canSetSubject ? (
            <select value={topic} onChange={(event) => setTopic(event.target.value as (typeof TOPIC_VALUES)[number])}>
              <option value="payment">{t("support.topic.payment")}</option>
              <option value="subscription">{t("support.topic.subscription")}</option>
              <option value="technical">{t("support.topic.technical")}</option>
              <option value="other">{t("support.topic.other")}</option>
            </select>
          ) : null}
          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows={4}
            placeholder={t("support.user.inputPlaceholder")}
          />
          <div className="pb-support-reply-actions">
            <button className="pb-btn pb-btn-secondary" type="button" onClick={() => void loadDialog()} disabled={sending || loading}>
              {t("support.user.refresh")}
            </button>
            <button className="pb-btn pb-btn-primary" type="submit" disabled={sending || !messageText.trim()}>
              {sending ? t("support.user.sending") : t("support.user.send")}
            </button>
          </div>
        </form>
        {notice ? <p className={notice.tone === "success" ? "pb-notice success" : "pb-notice error"}>{notice.text}</p> : null}
      </AppShellSection>

      <AppDisclaimer />
    </Layout>
  );
}
