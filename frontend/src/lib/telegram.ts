import WebApp from "@twa-dev/sdk";

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";

export function bootstrapTelegramApp() {
  try {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor("secondary_bg_color");
    WebApp.setBackgroundColor(WebApp.colorScheme === "dark" ? "#0a0a0a" : "#f8f9fa");
  } catch {
    // safe outside telegram
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
