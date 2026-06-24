import { type SVGProps } from "react";

// Единый стиль навигационных иконок — outline с тонкими скруглёнными линиями,
// как на скрине-референсе. stroke="currentColor" чтобы подсвечивать активную.

type IconProps = SVGProps<SVGSVGElement> & { active?: boolean };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
};

/** Главная — дом/обзор */
export function HomeIcon({ active, ...props }: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M3.5 10.5 12 4l8.5 6.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 9.5v9.2a1.3 1.3 0 0 0 1.3 1.3h10.4a1.3 1.3 0 0 0 1.3-1.3V9.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {active ? <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}

/** Чат — пузырь с точками */
export function ChatIcon({ active, ...props }: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v6A3.5 3.5 0 0 1 16.5 17H12l-4 3.2c-.7.56-1.7.06-1.7-.84V17H7.5A3.5 3.5 0 0 1 4 13.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10.5" r="1.05" fill="currentColor" />
      <circle cx="12" cy="10.5" r="1.05" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1.05" fill="currentColor" />
    </svg>
  );
}

/** Сигналы — радар/мишень (центральная, парящая) */
export function SignalsIcon({ active, ...props }: IconProps) {
  return (
    <svg {...base} {...props}>
      {/* внешние волны */}
      <path
        d="M5.5 14.5a7 7 0 0 1 9-9"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.9}
        strokeLinecap="round"
        opacity={active ? 1 : 0.7}
      />
      <path
        d="M8 12.5a4 4 0 0 1 4.5-4.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.9}
        strokeLinecap="round"
        opacity={active ? 1 : 0.85}
      />
      {/* центр-точка */}
      <circle cx="12" cy="12" r={active ? 2.6 : 2.4} fill="currentColor" />
      {/* штанга антенны */}
      <path
        d="M12 4.6v2.4"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 2}
        strokeLinecap="round"
      />
      <circle cx="12" cy="3.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Новости — газета/страница */
export function NewsIcon({ active, ...props }: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M5 5.5h10.5A1.5 1.5 0 0 1 17 7v11.5A1.5 1.5 0 0 0 18.5 20"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="5"
        width="11"
        height="13"
        rx="1.6"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinejoin="round"
      />
      <path d="M6.6 8.3h5.8M6.6 11h5.8M6.6 13.7h3.6" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" />
    </svg>
  );
}

/** Профиль — человек */
export function ProfileIcon({ active, ...props }: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle
        cx="12"
        cy="8.5"
        r="3.6"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      />
      <path
        d="M5 19.5c.7-3.4 3.5-5.5 7-5.5s6.3 2.1 7 5.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const NAV_ICONS = {
  home: HomeIcon,
  chat: ChatIcon,
  signals: SignalsIcon,
  news: NewsIcon,
  profile: ProfileIcon,
} as const;
