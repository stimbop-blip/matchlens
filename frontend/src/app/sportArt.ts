import { resolveSportKind, sportLabel, type SportKind } from "./sport";

type CoverVariant = "landscape" | "square";

type SportPalette = {
  start: string;
  end: string;
  glow: string;
  chip: string;
};

const SPORT_PALETTE: Record<SportKind, SportPalette> = {
  football: { start: "#1d4ed8", end: "#0b3a7a", glow: "#64d2ff", chip: "#8cd8ff" },
  hockey: { start: "#0f4c81", end: "#0b2f52", glow: "#4ed0ff", chip: "#b4e6ff" },
  tennis: { start: "#3e9b36", end: "#1f5f27", glow: "#b8ff66", chip: "#e5ffc5" },
  table_tennis: { start: "#b83d8f", end: "#6f1d64", glow: "#ffa3ef", chip: "#ffd2f6" },
  basketball: { start: "#da7a1f", end: "#7f3f0d", glow: "#ffbf7a", chip: "#ffe2c2" },
  volleyball: { start: "#0f8b84", end: "#0f5165", glow: "#7af0ff", chip: "#caf8ff" },
  esports: { start: "#4f46e5", end: "#1e1b6f", glow: "#90a3ff", chip: "#d7ddff" },
  darts: { start: "#8f4a16", end: "#4d2205", glow: "#ffb16a", chip: "#ffd9b4" },
  mma: { start: "#b91c1c", end: "#5f0f0f", glow: "#ff8a8a", chip: "#ffd0d0" },
  baseball: { start: "#0f766e", end: "#134e4a", glow: "#8ef6d8", chip: "#cffbef" },
  generic: { start: "#155e75", end: "#0f2d4b", glow: "#6fd8ff", chip: "#bfeaff" },
};

const COVER_CACHE = new Map<string, string>();
const BADGE_CACHE = new Map<SportKind, string>();

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function sportIconPath(kind: SportKind): string {
  if (kind === "football") return "M12 4.3a7.7 7.7 0 1 0 7.7 7.7A7.7 7.7 0 0 0 12 4.3m0 2.1 2.1 1.4-.8 2.5H10.7l-.8-2.5zm-3 5.7H15l1 2.8-2.1 1.5h-3.8L8 14.9z";
  if (kind === "hockey") return "M5.1 17.8c0 1 1 1.8 2 1.8h7.6c1 0 2-.8 2-1.8v-.6H5.1zm1-2.3h11.8l.6-5.1a2.2 2.2 0 0 0-2.2-2.5H7.9a2.2 2.2 0 0 0-2.2 2.5z";
  if (kind === "tennis" || kind === "table_tennis") return "M12 4.2a7.8 7.8 0 0 0 0 15.6A7.8 7.8 0 0 0 12 4.2m-4.8 3.1a5 5 0 0 1 3 4.7 5 5 0 0 1-3 4.8 6.2 6.2 0 0 1 0-9.5m9.6 0a6.2 6.2 0 0 1 0 9.5 5 5 0 0 1-3-4.8 5 5 0 0 1 3-4.7";
  if (kind === "basketball") return "M12 4.1a7.9 7.9 0 1 0 7.9 7.9A7.9 7.9 0 0 0 12 4.1m0 1.9v12M6 12h12M7.7 7.7a9.5 9.5 0 0 1 8.6 8.6m0-8.6a9.5 9.5 0 0 0-8.6 8.6";
  if (kind === "volleyball") return "M12 4.1a7.9 7.9 0 1 0 7.9 7.9A7.9 7.9 0 0 0 12 4.1m-5.6 4.7h5l2.4 3.3-1.8 4.8M9.9 5.2l2.3 3.6m5.6-1.4-4.4 1.4-1.9 5.1";
  if (kind === "esports") return "M5 7.5h14v8.6h-3.5L13 18.5h-2l-2.5-2.4H5zm2.2 2.1V14h9.6V9.6z";
  if (kind === "darts") return "m6.2 16.6 5-5 3.6 3.6 3.5-9.6-9.6 3.5 3.6 3.6-5 5z";
  if (kind === "mma") return "M6.1 12.2a5.9 5.9 0 1 1 11.8 0v.6H6.1Zm3.3 2.8h5.2v2.1H9.4Z";
  if (kind === "baseball") return "M12 4.1a7.9 7.9 0 1 0 7.9 7.9A7.9 7.9 0 0 0 12 4.1m-2 2.8c-.8 1.7-1.4 3.5-1.6 5.3M14 6.9c.8 1.7 1.4 3.5 1.6 5.3M10 17.1c-.8-1.7-1.4-3.5-1.6-5.3M14 17.1c.8-1.7 1.4-3.5 1.6-5.3";
  return "M12 4.2a7.8 7.8 0 1 0 7.8 7.8A7.8 7.8 0 0 0 12 4.2m0 3.3 1.4 2.8 3.1.5-2.3 2.2.5 3.2-2.7-1.5-2.7 1.5.5-3.2-2.3-2.2 3.1-.5z";
}

export function sportBadgeDataUri(sport: string): string {
  const kind = resolveSportKind(sport);
  const cached = BADGE_CACHE.get(kind);
  if (cached) return cached;

  const palette = SPORT_PALETTE[kind];
  const iconPath = sportIconPath(kind);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${kind}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.start}"/>
        <stop offset="100%" stop-color="${palette.end}"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.78" cy="0.18" r="0.8">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="chip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#bg)"/>
    <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#glow)"/>
    <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#chip)"/>
    <circle cx="46" cy="16" r="7" fill="#ffffff" fill-opacity="0.22"/>
    <circle cx="16" cy="46" r="10" fill="#ffffff" fill-opacity="0.14"/>
    <rect x="14" y="14" width="36" height="36" rx="12" fill="#ffffff" fill-opacity="0.14" stroke="#ffffff" stroke-opacity="0.32"/>
    <svg x="19" y="19" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${iconPath}" fill="#ffffff" fill-opacity="0.98" stroke="#ffffff" stroke-opacity="0.42" stroke-width="0.4"/>
    </svg>
  </svg>`;

  const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  BADGE_CACHE.set(kind, encoded);
  return encoded;
}

function cleanImage(value: string | null | undefined): string | null {
  const trimmed = (value || "").trim();
  return trimmed ? trimmed : null;
}

function sportDecorMarkup(kind: SportKind, width: number, height: number): string {
  const x = Math.round(width * 0.12);
  const y = Math.round(height * 0.14);
  const w = Math.round(width * 0.76);
  const h = Math.round(height * 0.58);
  const cx = Math.round(width * 0.5);
  const cy = Math.round(height * 0.43);

  if (kind === "football") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="6"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20"/><line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"/><circle cx="${cx}" cy="${cy}" r="${Math.round(h * 0.18)}"/></g>`;
  }

  if (kind === "hockey") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="6"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36"/><line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"/><circle cx="${Math.round(width * 0.28)}" cy="${cy}" r="${Math.round(h * 0.12)}"/><circle cx="${Math.round(width * 0.72)}" cy="${cy}" r="${Math.round(h * 0.12)}"/></g>`;
  }

  if (kind === "basketball") {
    const yMid = Math.round(height * 0.45);
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="6"><line x1="${x}" y1="${yMid}" x2="${x + w}" y2="${yMid}"/><path d="M ${x + 10} ${yMid} Q ${cx} ${y - 26} ${x + w - 10} ${yMid}"/><path d="M ${x + 10} ${yMid} Q ${cx} ${y + h + 24} ${x + w - 10} ${yMid}"/></g>`;
  }

  if (kind === "tennis" || kind === "table_tennis") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="6"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/><line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}"/><line x1="${x}" y1="${cy}" x2="${x + w}" y2="${cy}"/></g>`;
  }

  if (kind === "volleyball") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="6"><path d="M ${x} ${cy} H ${x + w}"/><path d="M ${x + Math.round(w * 0.2)} ${y} C ${cx} ${cy} ${cx} ${cy} ${x + Math.round(w * 0.8)} ${y + h}"/><path d="M ${x + Math.round(w * 0.8)} ${y} C ${cx} ${cy} ${cx} ${cy} ${x + Math.round(w * 0.2)} ${y + h}"/></g>`;
  }

  if (kind === "esports") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="5"><path d="M ${cx} ${y - 8} L ${x + w - 14} ${y + Math.round(h * 0.28)} L ${x + w - 14} ${y + Math.round(h * 0.72)} L ${cx} ${y + h + 8} L ${x + 14} ${y + Math.round(h * 0.72)} L ${x + 14} ${y + Math.round(h * 0.28)} Z"/></g>`;
  }

  if (kind === "darts") {
    const r1 = Math.round(h * 0.28);
    const r2 = Math.round(h * 0.18);
    const r3 = Math.round(h * 0.08);
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="6"><circle cx="${cx}" cy="${cy}" r="${r1}"/><circle cx="${cx}" cy="${cy}" r="${r2}"/><circle cx="${cx}" cy="${cy}" r="${r3}"/></g>`;
  }

  if (kind === "mma") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="6"><path d="M ${x + 20} ${y} H ${x + w - 20} L ${x + w} ${y + 20} V ${y + h - 20} L ${x + w - 20} ${y + h} H ${x + 20} L ${x} ${y + h - 20} V ${y + 20} Z"/></g>`;
  }

  if (kind === "baseball") {
    return `<g fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="6"><path d="M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z"/><path d="M ${x + Math.round(w * 0.25)} ${cy} Q ${cx} ${y + Math.round(h * 0.22)} ${x + Math.round(w * 0.75)} ${cy}"/><path d="M ${x + Math.round(w * 0.25)} ${cy} Q ${cx} ${y + Math.round(h * 0.78)} ${x + Math.round(w * 0.75)} ${cy}"/></g>`;
  }

  return `<g fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="6"><path d="M ${x} ${y + h} C ${x + Math.round(w * 0.3)} ${y + Math.round(h * 0.45)}, ${x + Math.round(w * 0.55)} ${y + h}, ${x + w} ${y + Math.round(h * 0.36)}"/><path d="M ${x} ${y + Math.round(h * 0.28)} C ${x + Math.round(w * 0.3)} ${y - 10}, ${x + Math.round(w * 0.55)} ${y + Math.round(h * 0.3)}, ${x + w} ${y - 8}"/></g>`;
}

export function sportCoverDataUri(sport: string, variant: CoverVariant = "landscape"): string {
  const kind = resolveSportKind(sport);
  const cacheKey = `${kind}:${variant}`;
  const cached = COVER_CACHE.get(cacheKey);
  if (cached) return cached;

  const palette = SPORT_PALETTE[kind];
  const iconPath = sportIconPath(kind);
  const label = escapeSvgText(sportLabel(kind, "en").toUpperCase());
  const decor = sportDecorMarkup(kind, variant === "landscape" ? 1200 : 720, variant === "landscape" ? 675 : 720);

  const width = variant === "landscape" ? 1200 : 720;
  const height = variant === "landscape" ? 675 : 720;
  const radius = variant === "landscape" ? 36 : 30;
  const iconBox = variant === "landscape" ? 168 : 178;
  const iconX = Math.round(width * 0.5 - iconBox / 2);
  const iconY = Math.round(height * 0.5 - iconBox / 2 - (variant === "landscape" ? 18 : 8));
  const titleY = height - (variant === "landscape" ? 48 : 40);
  const titleSize = variant === "landscape" ? 28 : 26;
  const brandSize = variant === "landscape" ? 24 : 20;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.start}"/>
        <stop offset="100%" stop-color="${palette.end}"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.84" cy="0.14" r="0.74">
        <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.50"/>
        <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="mesh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.20"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#061021" stop-opacity="0"/>
        <stop offset="100%" stop-color="#061021" stop-opacity="0.34"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#glow)"/>
    <path d="M-20 ${Math.round(height * 0.72)} C ${Math.round(width * 0.2)} ${Math.round(height * 0.52)}, ${Math.round(width * 0.38)} ${Math.round(height * 0.9)}, ${Math.round(width * 0.64)} ${Math.round(height * 0.62)} S ${Math.round(width * 0.98)} ${Math.round(height * 0.68)}, ${width + 20} ${Math.round(height * 0.56)}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="12"/>
    ${decor}
    <circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.24)}" r="${Math.round(height * 0.095)}" fill="#ffffff" fill-opacity="0.14"/>
    <circle cx="${Math.round(width * 0.84)}" cy="${Math.round(height * 0.74)}" r="${Math.round(height * 0.13)}" fill="#ffffff" fill-opacity="0.12"/>
    <circle cx="${Math.round(width * 0.92)}" cy="${Math.round(height * 0.18)}" r="${Math.round(height * 0.045)}" fill="#ffffff" fill-opacity="0.24"/>
    <rect x="${iconX}" y="${iconY}" width="${iconBox}" height="${iconBox}" rx="${Math.round(iconBox * 0.28)}" fill="#ffffff" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.34"/>
    <svg x="${iconX + Math.round(iconBox * 0.17)}" y="${iconY + Math.round(iconBox * 0.17)}" width="${Math.round(iconBox * 0.66)}" height="${Math.round(iconBox * 0.66)}" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${iconPath}" fill="#ffffff" fill-opacity="0.97" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.35"/>
    </svg>
    <rect x="${Math.round(width - 248)}" y="${Math.round(height - 78)}" width="220" height="40" rx="20" fill="#0a1524" fill-opacity="0.36"/>
    <text x="${Math.round(width - 138)}" y="${titleY}" text-anchor="middle" dominant-baseline="middle" fill="${palette.chip}" font-size="${titleSize}" font-family="Satoshi, Manrope, Segoe UI, sans-serif" font-weight="700" letter-spacing="0.6">${label}</text>
    <text x="${Math.round(32)}" y="${Math.round(height - 24)}" fill="#ffffff" fill-opacity="0.72" font-size="${brandSize}" font-family="Satoshi, Manrope, Segoe UI, sans-serif" font-weight="700" letter-spacing="1.4">PIT BET</text>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#mesh)"/>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#vignette)"/>
  </svg>`;

  const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  COVER_CACHE.set(cacheKey, encoded);
  return encoded;
}

export function resolvePredictionCover(options: {
  sport: string;
  betScreenshot?: string | null;
  resultScreenshot?: string | null;
  variant?: CoverVariant;
}): { src: string; fallback: boolean } {
  const betScreenshot = cleanImage(options.betScreenshot);
  if (betScreenshot) {
    return { src: betScreenshot, fallback: false };
  }

  const resultScreenshot = cleanImage(options.resultScreenshot);
  if (resultScreenshot) {
    return { src: resultScreenshot, fallback: false };
  }

  return {
    src: sportCoverDataUri(options.sport, options.variant || "landscape"),
    fallback: true,
  };
}
