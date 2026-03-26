declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        themeParams?: {
          bg_color?: string;
          secondary_bg_color?: string;
          text_color?: string;
          hint_color?: string;
          button_color?: string;
        };
        setHeaderColor?: (value: string) => void;
        setBackgroundColor?: (value: string) => void;
      };
    };
  }
}

const TELEGRAM_INIT_WAIT_MS = 10000;
const TELEGRAM_POLL_MS = 100;

export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData || "";
}

export async function waitForTelegramInitData(timeoutMs: number = TELEGRAM_INIT_WAIT_MS): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const initData = getTelegramInitData();
    if (initData) {
      return initData;
    }
    await new Promise((resolve) => setTimeout(resolve, TELEGRAM_POLL_MS));
  }
  return "";
}

export async function initTelegramWebApp(): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < TELEGRAM_INIT_WAIT_MS) {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.ready();
      webApp.expand();
      const theme = webApp.themeParams || {};
      const root = document.documentElement;
      if (theme.bg_color) root.style.setProperty("--tg-bg", theme.bg_color);
      if (theme.secondary_bg_color) root.style.setProperty("--tg-surface", theme.secondary_bg_color);
      if (theme.text_color) root.style.setProperty("--tg-text", theme.text_color);
      if (theme.hint_color) root.style.setProperty("--tg-muted", theme.hint_color);
      if (theme.button_color) root.style.setProperty("--tg-accent", theme.button_color);
      if (webApp.setHeaderColor) webApp.setHeaderColor(theme.secondary_bg_color || "#0f1724");
      if (webApp.setBackgroundColor) webApp.setBackgroundColor(theme.bg_color || "#070b13");
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, TELEGRAM_POLL_MS));
  }
}
