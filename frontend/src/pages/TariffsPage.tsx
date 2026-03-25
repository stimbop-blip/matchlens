import { Layout } from "../components/Layout";
import { useEffect, useState } from "react";

import { api } from "../services/api";

const PAYMENTS_ENABLED = (import.meta.env.VITE_PAYMENTS_ENABLED || "false") === "true";

export function TariffsPage() {
  const [tariffs, setTariffs] = useState<Array<{ code: string; name: string; price_rub: number; description: string | null }>>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.tariffs().then(setTariffs).catch(() => setTariffs([]));
  }, []);

  const onPay = async (code: "premium" | "vip") => {
    if (!PAYMENTS_ENABLED) {
      setMessage("Оплата временно отключена. Скоро подключим ЮMoney.");
      return;
    }
    try {
      const payment = await api.createPayment(code);
      window.location.href = payment.payment_url;
    } catch {
      setMessage("Не удалось создать платеж. Попробуйте позже.");
    }
  };

  return (
    <Layout>
      <section className="card">
        <h2>Тарифы</h2>
        {tariffs.map((item) => (
          <article key={item.code} className="prediction-item">
            <strong>{item.name}</strong>
            <div>{item.price_rub} RUB</div>
            <div className="muted">{item.description}</div>
            {item.code === "premium" || item.code === "vip" ? (
              <button className="btn" onClick={() => onPay(item.code)}>
                {PAYMENTS_ENABLED ? `Оформить ${item.name}` : "Скоро доступно"}
              </button>
            ) : null}
          </article>
        ))}
        {message ? <p>{message}</p> : null}
      </section>
    </Layout>
  );
}
