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

export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData || "";
}

export function initTelegramWebApp(): void {
  if (!window.Telegram?.WebApp) return;
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}
