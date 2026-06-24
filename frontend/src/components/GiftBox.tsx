import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { api, type AdCampaign } from "../services/api";
import { triggerHaptic } from "../services/telegram";

const SEEN_KEY = "pb-gift-seen-at";

/**
 * Анимированный подарок 🎁 на главной. По тапу открывает popup с рекламной
 * кампанией (заполняется админом в разделе «Реклама»). Если активной рекламы
 * нет — кнопка не рендерится.
 */
export function GiftBox() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .adsActive()
      .then((list) => {
        if (!alive) return;
        setAds(list);
        if (list.length === 0) return;
        const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
        const latest = list.reduce((max, item) => {
          const ts = new Date(item.created_at).getTime();
          return ts > max ? ts : max;
        }, 0);
        setHasNew(latest > seen);
      })
      .catch(() => {
        /* реклама опциональна */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (ads.length === 0) return null;

  const active = ads[0];

  const handleOpen = () => {
    triggerHaptic("impact-medium");
    setOpen(true);
    setHasNew(false);
    const latest = ads.reduce((max, item) => {
      const ts = new Date(item.created_at).getTime();
      return ts > max ? ts : max;
    }, 0);
    localStorage.setItem(SEEN_KEY, String(latest));
  };

  const handleCta = () => {
    triggerHaptic("selection");
    if (active.cta_url) {
      const url = active.cta_url.trim();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
    }
    setOpen(false);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={handleOpen}
        className="pb-gift-btn"
        aria-label="Подарок"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.88 }}
      >
        <motion.span
          className="pb-gift-emoji"
          animate={{ y: [0, -3, 0], rotate: [0, -6, 6, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          🎁
        </motion.span>
        {hasNew ? <span className="pb-gift-dot" aria-hidden="true" /> : null}
        <motion.span
          className="pb-gift-shine"
          aria-hidden="true"
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
        />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="pb-ad-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="pb-ad-card"
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="pb-ad-close" onClick={() => setOpen(false)} aria-label="Закрыть">
                ×
              </button>

              {active.image_url ? (
                <div className="pb-ad-cover" style={{ backgroundImage: `url(${active.image_url})` }}>
                  <span className="pb-ad-cover-tag">🎁 Подарок</span>
                </div>
              ) : (
                <div className="pb-ad-cover pb-ad-cover-fallback">
                  <span className="pb-ad-cover-emoji">🎁</span>
                </div>
              )}

              <div className="pb-ad-body">
                <h3 className="pb-ad-title">{active.title}</h3>
                <p className="pb-ad-text">{active.body}</p>

                {active.cta_text ? (
                  <button type="button" className="pb-ad-cta" onClick={handleCta}>
                    {active.cta_text}
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
