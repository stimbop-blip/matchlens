import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { api, type AdCampaign } from "../services/api";
import { triggerHaptic } from "../services/telegram";

const SEEN_KEY = "pb-gift-seen-at";

/**
 * Анимированный подарок 🎁 на главной.
 * Тап → крышка открывается + конфетти + «Тебе бонус!» → popup рекламы.
 * Реклама добавляется админом в разделе «Реклама». Пока активной рекламы нет —
 * всё равно показывается кнопка (красивая), а внутри — дефолтный бонусный экран.
 */

type Phase = "idle" | "shaking" | "opened";

const CONFETTI = ["🎉", "✨", "💫", "⭐", "🎊", "🪙", "💎"];

export function GiftBox() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showPopup, setShowPopup] = useState(false);
  const [hasNew, setHasNew] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .adsActive()
      .then((list) => {
        if (!alive) return;
        setAds(list);
        if (list.length === 0) {
          setHasNew(true);
          return;
        }
        const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
        const latest = list.reduce((max, item) => {
          const ts = new Date(item.created_at).getTime();
          return ts > max ? ts : max;
        }, 0);
        setHasNew(latest > seen);
      })
      .catch(() => {
        if (!alive) return;
        setHasNew(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const active = ads.length > 0 ? ads[0] : null;

  // Частицы конфетти — разлетаются из центра подарка при открытии
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 50 + Math.random() * 40;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 20,
          emoji: CONFETTI[i % CONFETTI.length],
          delay: Math.random() * 0.12,
        };
      }),
    [],
  );

  const handleTap = () => {
    if (phase !== "idle") return;
    triggerHaptic("impact-heavy");
    setPhase("shaking");

    // тряска → открывается крышка + конфетти
    window.setTimeout(() => {
      triggerHaptic("impact-medium");
      setPhase("opened");
    }, 520);

    // через 1.5с показываем popup
    window.setTimeout(() => {
      setShowPopup(true);
      setHasNew(false);
      if (active) {
        const latest = ads.reduce((max, item) => {
          const ts = new Date(item.created_at).getTime();
          return ts > max ? ts : max;
        }, 0);
        localStorage.setItem(SEEN_KEY, String(latest));
      }
    }, 1500);
  };

  const closePopup = () => {
    setShowPopup(false);
    // небольшой сброс, чтобы можно было снова нажать
    window.setTimeout(() => setPhase("idle"), 200);
  };

  const handleCta = () => {
    triggerHaptic("selection");
    if (active?.cta_url) {
      const url = active.cta_url.trim();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
    }
    closePopup();
  };

  return (
    <>
      <div className="pb-gift-wrap">
        <motion.button
          type="button"
          onClick={handleTap}
          className="pb-gift-btn"
          aria-label="Подарок"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Конфетти вылетает только при открытии */}
          <AnimatePresence>
            {phase === "opened" ? (
              <>
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    className="pb-gift-confetti"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                    animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0.3, 1.2, 0.8], rotate: Math.random() * 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
                  >
                    {p.emoji}
                  </motion.span>
                ))}
              </>
            ) : null}
          </AnimatePresence>

          {/* Бирка «новое» */}
          {hasNew && phase === "idle" ? <span className="pb-gift-dot" aria-hidden="true" /> : null}

          {/* Сам подарок: тело + крышка (крышка поднимается при opened) */}
          <motion.div
            className="pb-gift-3d"
            animate={
              phase === "shaking"
                ? { rotate: [0, -12, 12, -9, 9, -5, 0], x: [0, -2, 2, 0] }
                : phase === "idle"
                  ? { y: [0, -3, 0], rotate: [0, -4, 4, -2, 0] }
                  : { rotate: 0, y: 0 }
            }
            transition={
              phase === "shaking"
                ? { duration: 0.5 }
                : { duration: 2.6, repeat: phase === "idle" ? Infinity : 0, ease: "easeInOut" }
            }
          >
            <motion.span
              className="pb-gift-lid"
              animate={phase === "opened" ? { y: -16, rotate: -18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
            >
              🎀
            </motion.span>
            <span className="pb-gift-body">🎁</span>
            {phase === "opened" ? (
              <motion.span
                className="pb-gift-bonus"
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: -22 }}
                transition={{ type: "spring", stiffness: 360, damping: 16, delay: 0.1 }}
              >
                💰
              </motion.span>
            ) : null}
          </motion.div>

          {/* Сияние-блик */}
          <motion.span
            className="pb-gift-shine"
            aria-hidden="true"
            animate={{ x: ["-130%", "230%"] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {showPopup ? (
          <motion.div
            className="pb-ad-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              className="pb-ad-card"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 14 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="pb-ad-close" onClick={closePopup} aria-label="Закрыть">
                ×
              </button>

              {active?.image_url ? (
                <div className="pb-ad-cover" style={{ backgroundImage: `url(${active.image_url})` }}>
                  <span className="pb-ad-cover-tag">🎁 Тебе бонус!</span>
                </div>
              ) : (
                <div className="pb-ad-cover pb-ad-cover-fallback">
                  <motion.span
                    className="pb-ad-cover-emoji"
                    animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    🎁
                  </motion.span>
                  <span className="pb-ad-cover-tag">🎁 Тебе бонус!</span>
                </div>
              )}

              <div className="pb-ad-body">
                <h3 className="pb-ad-title">{active ? active.title : "Тебе бонус!"}</h3>
                <p className="pb-ad-text">
                  {active ? active.body : "Загляни позже — здесь появится твой бонус от команды PIT BET."}
                </p>

                <button type="button" className="pb-ad-cta" onClick={handleCta}>
                  {active?.cta_text || "Забрать бонус"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
