declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        themeParams?: {
          bg_color?: string;
        };
        setHeaderColor?: (value: string) => void;
        setBackgroundColor?: (value: string) => void;
      };
    };
  }
}

export type AppTheme = "dark" | "light";

const TELEGRAM_INIT_WAIT_MS = 10000;
const TELEGRAM_POLL_MS = 100;

function normalizeTheme(value: string | null | undefined): AppTheme {
  return value === "light" ? "light" : "dark";
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 0;
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function detectTelegramTheme(): AppTheme {
  const bg = window.Telegram?.WebApp?.themeParams?.bg_color;
  if (!bg) return "dark";
  return luminance(bg) > 0.55 ? "light" : "dark";
}

export function applyAppTheme(theme: AppTheme): void {
  const nextTheme = normalizeTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;

  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  const bg = nextTheme === "light" ? "#F3F6FB" : "#07111F";
  const header = nextTheme === "light" ? "#ECF1F8" : "#0A1628";
  if (webApp.setBackgroundColor) webApp.setBackgroundColor(bg);
  if (webApp.setHeaderColor) webApp.setHeaderColor(header);
}

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
      applyAppTheme(detectTelegramTheme());
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, TELEGRAM_POLL_MS));
  }
}
