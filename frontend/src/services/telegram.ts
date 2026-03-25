declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
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
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, TELEGRAM_POLL_MS));
  }
}
