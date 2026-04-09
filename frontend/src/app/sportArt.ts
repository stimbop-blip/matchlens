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

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seedUnit(seed: string, salt: string): number {
  return hashSeed(`${seed}:${salt}`) / 4294967295;
}

function sportDecorMarkup(kind: SportKind, width: number, height: number): string {
  const cx = Math.round(width * 0.5);
  const cy = Math.round(height * 0.5);
  const heroW = Math.round(width * 0.72);
  const heroH = Math.round(height * 0.5);
  const heroX = Math.round((width - heroW) * 0.5);
  const heroY = Math.round(height * 0.2);
  const icon = sportIconPath(kind);

  const accent: Record<SportKind, string> = {
    football: "#9fd7ff",
    hockey: "#aee7ff",
    tennis: "#dbff96",
    table_tennis: "#ffd1ef",
    basketball: "#ffd2a0",
    volleyball: "#b6f6ff",
    esports: "#bfd0ff",
    darts: "#ffd4ad",
    mma: "#ffd2d2",
    baseball: "#c7fff1",
    generic: "#bdeaff",
  };

  const meshDots = Array.from({ length: 6 }, (_, row) => {
    const y = Math.round(height * (0.2 + row * 0.11));
    return `<path d="M ${Math.round(width * 0.1)} ${y} H ${Math.round(width * 0.9)}" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>`;
  }).join("");

  const backdrop = `<g fill="none">
    <rect x="${heroX}" y="${heroY}" width="${heroW}" height="${heroH}" rx="28" stroke="#ffffff" stroke-opacity="0.14" stroke-width="3"/>
    <path d="M -20 ${Math.round(height * 0.76)} C ${Math.round(width * 0.2)} ${Math.round(height * 0.56)}, ${Math.round(width * 0.42)} ${Math.round(height * 0.92)}, ${Math.round(width * 0.66)} ${Math.round(height * 0.64)} S ${Math.round(width * 1.02)} ${Math.round(height * 0.74)}, ${width + 20} ${Math.round(height * 0.6)}" stroke="#ffffff" stroke-opacity="0.1" stroke-width="10"/>
    <path d="M -20 ${Math.round(height * 0.84)} C ${Math.round(width * 0.18)} ${Math.round(height * 0.72)}, ${Math.round(width * 0.38)} ${Math.round(height * 0.95)}, ${Math.round(width * 0.6)} ${Math.round(height * 0.74)} S ${Math.round(width * 1.02)} ${Math.round(height * 0.82)}, ${width + 20} ${Math.round(height * 0.7)}" stroke="#ffffff" stroke-opacity="0.08" stroke-width="5"/>
    <circle cx="${Math.round(width * 0.16)}" cy="${Math.round(height * 0.18)}" r="${Math.round(height * 0.09)}" fill="#ffffff" fill-opacity="0.1"/>
    <circle cx="${Math.round(width * 0.86)}" cy="${Math.round(height * 0.68)}" r="${Math.round(height * 0.12)}" fill="#ffffff" fill-opacity="0.08"/>
    ${meshDots}
  </g>`;

  const badge = `<g transform="translate(${Math.round(cx - 44)},${Math.round(cy - 44)})">
    <circle cx="44" cy="44" r="42" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.28" stroke-width="2"/>
    <circle cx="44" cy="44" r="30" fill="#ffffff" fill-opacity="0.2"/>
    <svg x="24" y="24" width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${icon}" fill="${accent[kind]}" fill-opacity="0.96" stroke="#ffffff" stroke-opacity="0.42" stroke-width="0.45"/>
    </svg>
  </g>`;

  if (kind === "football") {
    return `${backdrop}
      <path d="M ${Math.round(heroX + heroW * 0.12)} ${Math.round(heroY + heroH * 0.5)} H ${Math.round(heroX + heroW * 0.88)}" stroke="#ffffff" stroke-opacity="0.2" stroke-width="3"/>
      <path d="M ${cx} ${heroY} V ${Math.round(heroY + heroH)}" stroke="#ffffff" stroke-opacity="0.2" stroke-width="3"/>
      <circle cx="${cx}" cy="${Math.round(heroY + heroH * 0.5)}" r="${Math.round(heroH * 0.12)}" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="3"/>
      ${badge}`;
  }

  if (kind === "hockey") {
    return `${backdrop}
      <path d="M ${Math.round(width * 0.36)} ${Math.round(height * 0.58)} H ${Math.round(width * 0.66)}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="8" stroke-linecap="round"/>
      <path d="M ${Math.round(width * 0.62)} ${Math.round(height * 0.56)} h ${Math.round(width * 0.06)} l ${Math.round(-width * 0.025)} ${Math.round(height * 0.09)} h ${Math.round(-width * 0.06)} Z" fill="#ffffff" fill-opacity="0.56"/>
      ${badge}`;
  }

  if (kind === "tennis") {
    return `${backdrop}
      <path d="M ${Math.round(width * 0.32)} ${Math.round(height * 0.62)} C ${Math.round(width * 0.44)} ${Math.round(height * 0.4)}, ${Math.round(width * 0.58)} ${Math.round(height * 0.78)}, ${Math.round(width * 0.72)} ${Math.round(height * 0.46)}" stroke="#ffffff" stroke-opacity="0.24" stroke-width="4" fill="none"/>
      <circle cx="${Math.round(width * 0.66)}" cy="${Math.round(height * 0.46)}" r="${Math.round(height * 0.035)}" fill="${accent[kind]}" fill-opacity="0.95"/>
      ${badge}`;
  }

  if (kind === "table_tennis") {
    return `${backdrop}
      <ellipse cx="${Math.round(width * 0.48)}" cy="${Math.round(height * 0.54)}" rx="${Math.round(width * 0.05)}" ry="${Math.round(height * 0.08)}" fill="${accent[kind]}" fill-opacity="0.82"/>
      <rect x="${Math.round(width * 0.47)}" y="${Math.round(height * 0.61)}" width="${Math.round(width * 0.02)}" height="${Math.round(height * 0.09)}" rx="6" fill="#ffffff" fill-opacity="0.8"/>
      <circle cx="${Math.round(width * 0.61)}" cy="${Math.round(height * 0.48)}" r="${Math.round(height * 0.024)}" fill="#ffffff" fill-opacity="0.96"/>
      ${badge}`;
  }

  if (kind === "basketball") {
    return `${backdrop}
      <path d="M ${Math.round(width * 0.36)} ${cy} H ${Math.round(width * 0.64)}" stroke="#ffffff" stroke-opacity="0.28" stroke-width="3"/>
      <path d="M ${cx} ${Math.round(height * 0.34)} V ${Math.round(height * 0.66)}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="3"/>
      <path d="M ${Math.round(width * 0.4)} ${Math.round(height * 0.36)} C ${Math.round(width * 0.5)} ${Math.round(height * 0.45)}, ${Math.round(width * 0.5)} ${Math.round(height * 0.55)}, ${Math.round(width * 0.4)} ${Math.round(height * 0.64)}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="3" fill="none"/>
      <path d="M ${Math.round(width * 0.6)} ${Math.round(height * 0.36)} C ${Math.round(width * 0.5)} ${Math.round(height * 0.45)}, ${Math.round(width * 0.5)} ${Math.round(height * 0.55)}, ${Math.round(width * 0.6)} ${Math.round(height * 0.64)}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="3" fill="none"/>
      ${badge}`;
  }

  if (kind === "volleyball") {
    return `${backdrop}
      <circle cx="${cx}" cy="${cy}" r="${Math.round(height * 0.12)}" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="3"/>
      <path d="M ${Math.round(cx - height * 0.12)} ${cy} C ${Math.round(cx - height * 0.05)} ${Math.round(cy - height * 0.08)}, ${Math.round(cx + height * 0.05)} ${Math.round(cy - height * 0.08)}, ${Math.round(cx + height * 0.12)} ${cy}" stroke="#ffffff" stroke-opacity="0.3" stroke-width="3" fill="none"/>
      <path d="M ${Math.round(cx - height * 0.12)} ${cy} C ${Math.round(cx - height * 0.05)} ${Math.round(cy + height * 0.08)}, ${Math.round(cx + height * 0.05)} ${Math.round(cy + height * 0.08)}, ${Math.round(cx + height * 0.12)} ${cy}" stroke="#ffffff" stroke-opacity="0.3" stroke-width="3" fill="none"/>
      ${badge}`;
  }

  if (kind === "esports") {
    return `${backdrop}
      <rect x="${Math.round(width * 0.41)}" y="${Math.round(height * 0.41)}" width="${Math.round(width * 0.18)}" height="${Math.round(height * 0.12)}" rx="22" fill="#071124" fill-opacity="0.64" stroke="#c2d7ff" stroke-opacity="0.44"/>
      <circle cx="${Math.round(width * 0.46)}" cy="${Math.round(height * 0.47)}" r="${Math.round(height * 0.018)}" fill="#ffffff" fill-opacity="0.86"/>
      <circle cx="${Math.round(width * 0.55)}" cy="${Math.round(height * 0.465)}" r="${Math.round(height * 0.012)}" fill="${accent[kind]}"/>
      <circle cx="${Math.round(width * 0.57)}" cy="${Math.round(height * 0.49)}" r="${Math.round(height * 0.012)}" fill="${accent[kind]}"/>
      ${badge}`;
  }

  if (kind === "darts") {
    return `${backdrop}
      <circle cx="${cx}" cy="${cy}" r="${Math.round(height * 0.11)}" fill="#ffffff" fill-opacity="0.2"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.round(height * 0.08)}" fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.round(height * 0.045)}" fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="3"/>
      <path d="M ${Math.round(width * 0.68)} ${Math.round(height * 0.36)} L ${Math.round(cx)} ${Math.round(cy)}" stroke="#ffffff" stroke-opacity="0.9" stroke-width="4" stroke-linecap="round"/>
      ${badge}`;
  }

  if (kind === "mma") {
    return `${backdrop}
      <path d="M ${Math.round(heroX + 36)} ${heroY} H ${Math.round(heroX + heroW - 36)} L ${heroX + heroW} ${Math.round(heroY + 36)} V ${Math.round(heroY + heroH - 36)} L ${Math.round(heroX + heroW - 36)} ${heroY + heroH} H ${Math.round(heroX + 36)} L ${heroX} ${Math.round(heroY + heroH - 36)} V ${Math.round(heroY + 36)} Z" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="3"/>
      <rect x="${Math.round(width * 0.44)}" y="${Math.round(height * 0.43)}" width="${Math.round(width * 0.042)}" height="${Math.round(height * 0.11)}" rx="12" fill="#ffb9b9" fill-opacity="0.82"/>
      <rect x="${Math.round(width * 0.52)}" y="${Math.round(height * 0.43)}" width="${Math.round(width * 0.042)}" height="${Math.round(height * 0.11)}" rx="12" fill="#ffe0e0" fill-opacity="0.82"/>
      ${badge}`;
  }

  if (kind === "baseball") {
    return `${backdrop}
      <circle cx="${cx}" cy="${cy}" r="${Math.round(height * 0.1)}" fill="#ffffff" fill-opacity="0.3"/>
      <path d="M ${Math.round(cx - height * 0.06)} ${Math.round(cy - height * 0.055)} C ${Math.round(cx - height * 0.022)} ${Math.round(cy - height * 0.02)}, ${Math.round(cx - height * 0.022)} ${Math.round(cy + height * 0.02)}, ${Math.round(cx - height * 0.06)} ${Math.round(cy + height * 0.055)}" stroke="#e27373" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M ${Math.round(cx + height * 0.06)} ${Math.round(cy - height * 0.055)} C ${Math.round(cx + height * 0.022)} ${Math.round(cy - height * 0.02)}, ${Math.round(cx + height * 0.022)} ${Math.round(cy + height * 0.02)}, ${Math.round(cx + height * 0.06)} ${Math.round(cy + height * 0.055)}" stroke="#e27373" stroke-width="3" stroke-linecap="round" fill="none"/>
      ${badge}`;
  }

  return `${backdrop}
    <path d="M ${Math.round(width * 0.3)} ${Math.round(height * 0.62)} C ${Math.round(width * 0.42)} ${Math.round(height * 0.44)}, ${Math.round(width * 0.56)} ${Math.round(height * 0.76)}, ${Math.round(width * 0.7)} ${Math.round(height * 0.52)}" stroke="#ffffff" stroke-opacity="0.3" stroke-width="4" fill="none"/>
    ${badge}`;
}

export function sportCoverDataUri(sport: string, variant: CoverVariant = "landscape", seed = ""): string {
  const kind = resolveSportKind(sport);
  const seedKey = seed.trim();
  const cacheKey = `${kind}:${variant}:${seedKey}`;
  const cached = COVER_CACHE.get(cacheKey);
  if (cached) return cached;

  const palette = SPORT_PALETTE[kind];
  const label = escapeSvgText(sportLabel(kind, "en").toUpperCase());
  const decor = sportDecorMarkup(kind, variant === "landscape" ? 1200 : 720, variant === "landscape" ? 675 : 720);

  const width = variant === "landscape" ? 1200 : 720;
  const height = variant === "landscape" ? 675 : 720;
  const visualSeed = seedKey || `${kind}:${variant}`;
  const waveA = seedUnit(visualSeed, "waveA");
  const waveB = seedUnit(visualSeed, "waveB");
  const orbA = seedUnit(visualSeed, "orbA");
  const orbB = seedUnit(visualSeed, "orbB");
  const orbC = seedUnit(visualSeed, "orbC");
  const titleShift = seedUnit(visualSeed, "title");
  const lineShift = seedUnit(visualSeed, "line");
  const radius = variant === "landscape" ? 36 : 30;
  const titleY = height - (variant === "landscape" ? 48 : 40);
  const titleSize = variant === "landscape" ? 28 : 26;
  const brandSize = variant === "landscape" ? 24 : 20;
  const arcStartY = Math.round(height * (0.7 + (waveA - 0.5) * 0.12));
  const arcMidY1 = Math.round(height * (0.52 + (waveB - 0.5) * 0.14));
  const arcMidY2 = Math.round(height * (0.9 + (waveA - 0.5) * 0.08));
  const arcMidY3 = Math.round(height * (0.62 + (waveB - 0.5) * 0.1));
  const arcEndY = Math.round(height * (0.56 + (waveA - 0.5) * 0.14));
  const orb1x = Math.round(width * (0.14 + orbA * 0.12));
  const orb1y = Math.round(height * (0.18 + orbB * 0.16));
  const orb2x = Math.round(width * (0.78 + orbC * 0.14));
  const orb2y = Math.round(height * (0.66 + orbA * 0.18));
  const orb3x = Math.round(width * (0.86 + orbB * 0.1));
  const orb3y = Math.round(height * (0.1 + orbC * 0.2));
  const titleX = Math.round(width - (112 + titleShift * 56));
  const chipX = Math.round(width - (248 + lineShift * 26));

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
      <linearGradient id="topLight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#glow)"/>
    <path d="M-20 ${arcStartY} C ${Math.round(width * 0.2)} ${arcMidY1}, ${Math.round(width * 0.38)} ${arcMidY2}, ${Math.round(width * 0.64)} ${arcMidY3} S ${Math.round(width * 0.98)} ${Math.round(height * 0.68)}, ${width + 20} ${arcEndY}" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="12"/>
    ${decor}
    <circle cx="${orb1x}" cy="${orb1y}" r="${Math.round(height * 0.095)}" fill="#ffffff" fill-opacity="0.14"/>
    <circle cx="${orb2x}" cy="${orb2y}" r="${Math.round(height * 0.13)}" fill="#ffffff" fill-opacity="0.12"/>
    <circle cx="${orb3x}" cy="${orb3y}" r="${Math.round(height * 0.045)}" fill="#ffffff" fill-opacity="0.24"/>
    <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.26)}" rx="${radius}" fill="url(#topLight)"/>
    <rect x="${chipX}" y="${Math.round(height - 78)}" width="220" height="40" rx="20" fill="#0a1524" fill-opacity="0.36"/>
    <text x="${titleX}" y="${titleY}" text-anchor="middle" dominant-baseline="middle" fill="${palette.chip}" font-size="${titleSize}" font-family="Satoshi, Manrope, Segoe UI, sans-serif" font-weight="700" letter-spacing="0.6">${label}</text>
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
  seed?: string;
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
    src: sportCoverDataUri(options.sport, options.variant || "landscape", options.seed || ""),
    fallback: true,
  };
}
