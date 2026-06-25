import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Bottom sheet: плавно выезжает снизу и стоит на месте.
 * Затемнённый фон, ручка, закрытие по Escape и по тапу на фон.
 * Без drag-to-close — шторка не двигается при прокрутке формы.
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  // Mount + анимация появления
  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Блокируем прокрутку фона, пока шторка открыта
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // Закрытие по Escape
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  // Рендерим в document.body через портал.
  // Это критично: .pb-premium-panel (предок шторки в админке) имеет
  // backdrop-filter: blur(...), а любой backdrop-filter/filter/transform/will-change
  // на предке создаёт containing block для position:fixed. Из-за этого шторка
  // позиционировалась относительно панели, а не вьюпорта — выезжала криво,
  // затемнение было частичным (просвечивал текст карточек), фон листался,
  // а кнопка × не попадала по тапу. Портал разрывает эту цепочку.
  return createPortal(
    <div
      className={`admin-sheet-backdrop bs-bottom ${visible ? "visible" : ""}`}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`admin-sheet bs-sheet ${visible ? "visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="bs-grab" aria-label="Close" onClick={onClose} />
        <div className="admin-sheet-head bs-head">
          <strong>{title}</strong>
          <button type="button" className="admin-sheet-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="admin-sheet-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
