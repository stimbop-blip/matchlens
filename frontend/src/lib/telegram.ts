import WebApp from "@twa-dev/sdk";

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";

export function bootstrapTelegramApp() {
  let telegramTheme: "light" | "dark" = "dark";

  try {
    // Perform critical Telegram initialization as early as possible.
    WebApp.ready();
    WebApp.expand();
    telegramTheme = WebApp.colorScheme === "dark" ? "dark" : "light";
  } catch {
    // safe outside telegram
  }

  // Non-critical visual sync after app becomes interactive.
  const setVisuals = () => {
    try {
      WebApp.setHeaderColor("secondary_bg_color");
      WebApp.setBackgroundColor(telegramTheme === "dark" ? "#0a0a0a" : "#f8f9fa");
    } catch {
      // noop
    }
  };

  if (typeof window !== "undefined") {
    window.setTimeout(setVisuals, 0);
  } else {
    setVisuals();
  }
}

export function getTelegramInitData() {
  try {
    return WebApp.initData || "";
  } catch {
    return "";
  }
}

export function getTelegramTheme(): "light" | "dark" {
  try {
    return WebApp.colorScheme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function onTelegramThemeChange(callback: (theme: "light" | "dark") => void) {
  const handler = () => callback(WebApp.colorScheme === "light" ? "light" : "dark");
  try {
    WebApp.onEvent("themeChanged", handler);
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      WebApp.offEvent("themeChanged", handler);
    } catch {
      // noop
    }
  };
}

export function impact(style: HapticStyle = "light") {
  try {
    WebApp.HapticFeedback.impactOccurred(style);
  } catch {
    // noop
  }
}

export function selectionChanged() {
  try {
    WebApp.HapticFeedback.selectionChanged();
  } catch {
    // noop
  }
}

export function notifySuccess() {
  try {
    WebApp.HapticFeedback.notificationOccurred("success");
  } catch {
    // noop
  }
}

export function notifyError() {
  try {
    WebApp.HapticFeedback.notificationOccurred("error");
  } catch {
    // noop
  }
}

export function openExternalLink(url: string) {
  try {
    WebApp.openLink(url, { try_instant_view: true });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
