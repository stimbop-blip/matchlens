import { motion } from "framer-motion";

type AIScanningLoaderProps = {
  className?: string;
  compact?: boolean;
  fullscreen?: boolean;
};

/**
 * Премиум скелетон-загрузчик.
 * Заменяет старый радар-сканер на чистую, быструю анимацию загрузки.
 * Имя компонента сохранено для совместимости со всеми местами использования.
 */
export function AIScanningLoader({ className = "", compact = false, fullscreen = false }: AIScanningLoaderProps) {
  const skeletonCount = compact ? 2 : 4;

  return (
    <div
      className={`pb-skeleton-loader-v3 ${className}`}
      style={{
        width: "100%",
        minHeight: fullscreen ? "100vh" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: fullscreen ? "24px 18px" : compact ? "8px 0" : "16px 0",
        gap: compact ? 8 : 14,
      }}
      role="status"
      aria-live="polite"
    >
      {/* Логотип с pulse — только в полном/fullscreen режиме */}
      {!compact ? (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1, 0.97] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: fullscreen ? 13 : 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              padding: "5px 14px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #22d3ee, #a78bfa, #fbbf24)",
              color: "#070b16",
              boxShadow: "0 0 18px rgba(34, 211, 238, 0.4)",
            }}
          >
            PIT BET
          </div>
          <div className="pb-skeleton-text-v3" style={{ fontSize: 13, color: "var(--text-secondary, #8a9cbd)", fontWeight: 500 }}>
            Загрузка аналитики…
          </div>
        </motion.div>
      ) : null}

      {/* Скелетон-карточки */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: compact ? 8 : 12,
        }}
      >
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.12, duration: 0.4, ease: "easeOut" }}
            className="pb-skeleton-card-v3"
            style={{
              width: "100%",
              height: compact ? (idx === 0 ? 56 : 44) : idx === 0 ? 80 : 60,
              borderRadius: compact ? 12 : 16,
            }}
          />
        ))}
      </div>
    </div>
  );
}
