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
          button_text_color?: string;
          link_color?: string;
        };
        setHeaderColor?: (value: string) => void;
        setBackgroundColor?: (value: string) => void;
      };
    };
  }
}

const TELEGRAM_INIT_WAIT_MS = 10000;
const TELEGRAM_POLL_MS = 100;

type ThemePalette = {
  bg: string;
  bgGrad1: string;
  bgGrad2: string;
  surface: string;
  surfaceAlt: string;
  surfaceSoft: string;
  line: string;
  lineStrong: string;
  text: string;
  muted: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentContrast: string;
};

const FALLBACK_THEME: ThemePalette = {
  bg: "#071021",
  bgGrad1: "#142644",
  bgGrad2: "#0a1933",
  surface: "#111f37",
  surfaceAlt: "#182b48",
  surfaceSoft: "#1b3254",
  line: "#2a4369",
  lineStrong: "#365a8f",
  text: "#eaf1ff",
  muted: "#98acc8",
  accent: "#35d7ac",
  accentStrong: "#27bc95",
  accentSoft: "#1b5f52",
  accentContrast: "#04110d",
};

function normalizeHex(value?: string): string | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/.test(hex)) return null;
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }
  return `#${hex}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex) || "#000000";
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(hexA: string, hexB: string, ratio: number): string {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  const value = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    ar + (br - ar) * value,
    ag + (bg - ag) * value,
    ab + (bb - ab) * value,
  );
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(hexA: string, hexB: string): number {
  const l1 = luminance(hexA);
  const l2 = luminance(hexB);
  const [bright, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (bright + 0.05) / (dark + 0.05);
}

function ensureReadable(candidate: string, fallback: string, bg: string, minRatio: number): string {
  return contrast(candidate, bg) >= minRatio ? candidate : fallback;
}

function isDark(hex: string): boolean {
  return luminance(hex) < 0.42;
}

function derivePalette(theme: NonNullable<NonNullable<Window["Telegram"]>["WebApp"]>["themeParams"] = {}): ThemePalette {
  const tgBg = normalizeHex(theme.bg_color);
  const tgSurface = normalizeHex(theme.secondary_bg_color);
  const tgText = normalizeHex(theme.text_color);
  const tgHint = normalizeHex(theme.hint_color);
  const tgAccent = normalizeHex(theme.button_color);

  const safeBase = Boolean(tgBg && tgText && isDark(tgBg) && contrast(tgBg, tgText) >= 4.5);
  if (!safeBase || !tgBg || !tgText) {
    return FALLBACK_THEME;
  }

  const bg = tgBg;
  const surface = tgSurface || mix(bg, "#ffffff", 0.09);
  const surfaceAlt = mix(surface, "#ffffff", 0.07);
  const surfaceSoft = mix(surface, "#ffffff", 0.12);
  const line = mix(surface, "#ffffff", 0.2);
  const lineStrong = mix(surface, "#ffffff", 0.3);
  const text = ensureReadable(tgText, FALLBACK_THEME.text, surface, 4.5);
  const mutedCandidate = tgHint || mix(text, surface, 0.48);
  const muted = ensureReadable(mutedCandidate, FALLBACK_THEME.muted, surface, 3.2);

  const accentCandidate = tgAccent || FALLBACK_THEME.accent;
  const accent = contrast(accentCandidate, surface) >= 2.2 ? accentCandidate : FALLBACK_THEME.accent;
  const accentStrong = mix(accent, "#000000", 0.14);
  const accentSoft = mix(accent, surface, 0.7);
  const accentContrast = contrast(accent, "#ffffff") >= 4.5 ? "#ffffff" : "#07110d";
  const bgGrad1 = mix(bg, "#203a65", 0.32);
  const bgGrad2 = mix(bg, "#0f2747", 0.24);

  return {
    bg,
    bgGrad1,
    bgGrad2,
    surface,
    surfaceAlt,
    surfaceSoft,
    line,
    lineStrong,
    text,
    muted,
    accent,
    accentStrong,
    accentSoft,
    accentContrast,
  };
}

function applyPalette(theme: ThemePalette): void {
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--bg-grad-1", theme.bgGrad1);
  root.style.setProperty("--bg-grad-2", theme.bgGrad2);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-alt", theme.surfaceAlt);
  root.style.setProperty("--surface-soft", theme.surfaceSoft);
  root.style.setProperty("--line", theme.line);
  root.style.setProperty("--line-strong", theme.lineStrong);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-strong", theme.accentStrong);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--accent-contrast", theme.accentContrast);
  root.style.colorScheme = "dark";
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
      const palette = derivePalette(webApp.themeParams || {});
      applyPalette(palette);
      if (webApp.setHeaderColor) webApp.setHeaderColor(palette.surfaceAlt);
      if (webApp.setBackgroundColor) webApp.setBackgroundColor(palette.bg);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, TELEGRAM_POLL_MS));
  }
}
