import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Crown, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import { useHaptics } from "../hooks/useHaptics";
import { api, type Tariff } from "../lib/api";
import { useI18n } from "../lib/i18n";

const fallbackTariffs: Tariff[] = [
  { id: "free", title: "Free", price: 0, periodDays: 7, features: ["Basic daily picks", "Limited analytics", "Community access"] },
  {
    id: "premium",
    title: "Premium",
    price: 1990,
    periodDays: 30,
    isBestChoice: true,
    features: ["All high-confidence signals", "ROI analytics", "Priority updates", "Advanced filters"],
  },
  { id: "vip", title: "VIP", price: 5990, periodDays: 90, features: ["Premium + private insights", "VIP-only markets", "Highest model priority"] },
];

export function Tariffs() {
  const h = useHaptics();
  const { t } = useI18n();
  const [selected, setSelected] = useState<string>("premium");

  const tariffsQuery = useQuery({ queryKey: ["tariffs"], queryFn: api.getTariffs });
  const items = useMemo(() => (tariffsQuery.data?.length ? tariffsQuery.data : fallbackTariffs), [tariffsQuery.data]);
  const current = useMemo(() => items.find((x) => x.id === selected) ?? items[0], [items, selected]);

  const buyMutation = useMutation({ mutationFn: (tariffId: string) => api.buyTariff({ tariffId, paymentMethod: "card" }) });

  return (
    <div className="space-y-3 pb-2">
      <section className="glass neon p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{t("tariffs.eyebrow")}</p>
        <h1 className="text-[21px] font-semibold text-[var(--text-primary)]">{t("tariffs.title")}</h1>
      </section>

      <section className="space-y-2.5">
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => {
                h.tap();
                setSelected(item.id);
              }}
              className={`glass w-full p-4 text-left ${active ? "neon" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{item.periodDays} {t("tariffs.daysAccess")}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.isBestChoice ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                      <Crown size={12} /> {t("tariffs.bestChoice")}
                    </span>
                  ) : null}
                  <span className="text-xl font-semibold text-[var(--text-primary)]">{item.price} ₽</span>
                </div>
              </div>
              <div className="mt-3 grid gap-1.5">
                {item.features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                    <Check size={13} className="text-[var(--accent)]" />
                    {f}
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </section>

      <section className="glass p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{current?.title}</h2>
        <button
          type="button"
          disabled={buyMutation.isPending}
          onClick={() => {
            if (!current) return;
            h.medium();
            buyMutation.mutate(current.id);
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--accent)_22%,transparent)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]"
        >
          <Zap size={16} />
          {buyMutation.isPending ? t("tariffs.processing") : t("tariffs.activateNow")}
        </button>
      </section>
    </div>
  );
}
