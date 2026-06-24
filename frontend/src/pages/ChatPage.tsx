import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "../app/i18n";
import { Layout } from "../components/Layout";
import { api, type ChatMessage } from "../services/api";

const REFRESH_INTERVAL_MS = 8000;
const MAX_CHARS = 500;

function formatTime(value: string, language: "ru" | "en"): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString(language === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

// Детерминированный цвет аватара по id пользователя
const AVATAR_COLORS = [
  ["#00d9b8", "#0099ff"],
  ["#7c5cff", "#4d8dff"],
  ["#ff6b9d", "#ff9a5a"],
  ["#36d1dc", "#5b86e5"],
  ["#f7971e", "#ffd200"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#330867"],
];

function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const [a, b] = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

export function ChatPage() {
  const { t, language } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const lastCountRef = useRef(0);

  const loadHistory = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const payload = await api.chatHistory();
      setMessages(payload.messages);
    } catch (error) {
      if (!silent) setNotice({ tone: "error", text: parseError(error, t("chat.loadFailed")) });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  // автообновление ленты
  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadHistory(true);
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  // авто-скролл вниз при появлении новых сообщений
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    if (messages.length > lastCountRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    lastCountRef.current = messages.length;
  }, [messages.length]);

  const onlineCount = useMemo(() => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return messages.filter((m) => new Date(m.created_at).getTime() > fiveMinAgo)
      .map((m) => m.author_user_id)
      .filter((v, i, arr) => arr.indexOf(v) === i).length;
  }, [messages]);

  const onSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || body.length > MAX_CHARS) return;

    setSending(true);
    setNotice(null);
    try {
      const created = await api.chatSend(body);
      setMessages((prev) => [...prev, created]);
      setDraft("");
    } catch (error) {
      setNotice({ tone: "error", text: parseError(error, t("chat.sendFailed")) });
    } finally {
      setSending(false);
    }
  };

  const roleBadge = (role: string) => {
    if (role === "admin") return <span className="pb-chat-badge admin">{t("chat.admin")}</span>;
    if (role === "support") return <span className="pb-chat-badge support">{t("chat.support")}</span>;
    return null;
  };

  return (
    <Layout>
      <section className="pb-hero-panel pb-reveal pb-chat-hero">
        <div className="pb-hero-top">
          <span className="pb-eyebrow">PIT BET</span>
          <span className="pb-chat-online">
            <span className="pb-chat-online-dot" aria-hidden="true" />
            {onlineCount > 0 ? t("chat.onlineMany", { count: onlineCount }) : t("chat.online")}
          </span>
        </div>
        <h2>{t("chat.hero.title")}</h2>
        <p>{t("chat.hero.subtitle")}</p>
      </section>

      <section className="pb-chat-shell">
        <div className="pb-chat-thread" ref={threadRef} role="log" aria-live="polite">
          {loading && messages.length === 0 ? <p className="pb-empty-state">{t("common.loading")}</p> : null}
          {!loading && messages.length === 0 ? <p className="pb-empty-state">{t("chat.empty")}</p> : null}

          {messages.map((item) => (
            <article key={item.id} className={`pb-chat-message ${item.mine ? "mine" : "them"}`}>
              <span
                className="pb-chat-avatar"
                style={{ background: avatarGradient(item.author_user_id) }}
                aria-hidden="true"
              >
                {item.author_initials || item.author_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="pb-chat-bubble-wrap">
                <div className="pb-chat-meta">
                  <strong>{item.mine ? t("chat.you") : item.author_name}</strong>
                  {roleBadge(item.author_role)}
                  <span className="pb-chat-time">{formatTime(item.created_at, language)}</span>
                </div>
                <div className="pb-chat-bubble">{item.body}</div>
              </div>
            </article>
          ))}
        </div>

        <form className="pb-chat-composer" onSubmit={onSend}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("chat.placeholder")}
            maxLength={MAX_CHARS}
            disabled={sending}
            aria-label={t("chat.placeholder")}
          />
          <button className="pb-chat-send" type="submit" disabled={sending || !draft.trim()}>
            {sending ? "…" : t("chat.send")}
          </button>
        </form>
        {notice ? <p className={notice.tone === "success" ? "pb-notice success" : "pb-notice error"}>{notice.text}</p> : null}
      </section>
    </Layout>
  );
}
