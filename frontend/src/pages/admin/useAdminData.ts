import { useCallback, useEffect, useState } from "react";

import { api } from "../../services/api";
import {
  type AdCampaign,
  type AdminPayment,
  type AdminPromoCode,
  type AdminStats,
  type AdminSubscription,
  type AdminUser,
  type NewsPost,
  type PaymentMethod,
  type Prediction,
} from "./shared";

export type NotificationDeliveryStats = {
  ok: boolean;
  total: number;
  sent: number;
  failed: number;
  queued: number;
};

export type AdminState = {
  predictions: Prediction[];
  users: AdminUser[];
  subscriptions: AdminSubscription[];
  payments: AdminPayment[];
  paymentMethods: PaymentMethod[];
  news: NewsPost[];
  ads: AdCampaign[];
  promoCodes: AdminPromoCode[];
  stats: AdminStats | null;
  deliveryStats: NotificationDeliveryStats | null;
};

const EMPTY_STATE: AdminState = {
  predictions: [],
  users: [],
  subscriptions: [],
  payments: [],
  paymentMethods: [],
  news: [],
  ads: [],
  promoCodes: [],
  stats: null,
  deliveryStats: null,
};

export function useAdminData(isAdmin: boolean) {
  const [state, setState] = useState<AdminState>(EMPTY_STATE);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    const [p, u, s, pay, paymentMethodList, n, adList, promos, st, notifStats] = await Promise.allSettled([
      api.adminPredictions(),
      api.adminUsers(),
      api.adminSubscriptions(),
      api.adminPayments(),
      api.adminPaymentMethods(),
      api.adminNews(),
      api.adminAds(),
      api.adminPromoCodes(),
      api.adminStats(),
      api.adminNotificationStats(),
    ]);

    setState({
      predictions: p.status === "fulfilled" ? p.value : [],
      users: u.status === "fulfilled" ? u.value : [],
      subscriptions: s.status === "fulfilled" ? s.value : [],
      payments: pay.status === "fulfilled" ? pay.value : [],
      paymentMethods: paymentMethodList.status === "fulfilled" ? paymentMethodList.value : [],
      news: n.status === "fulfilled" ? n.value : [],
      ads: adList.status === "fulfilled" ? adList.value : [],
      promoCodes: promos.status === "fulfilled" ? promos.value : [],
      stats: st.status === "fulfilled" ? st.value : null,
      deliveryStats: notifStats.status === "fulfilled" ? notifStats.value : null,
    });
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await loadAll();
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    loadAll().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, loadAll]);

  return { state, loading, refreshAll, loadAll };
}
