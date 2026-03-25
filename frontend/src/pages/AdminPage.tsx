import { FormEvent, useEffect, useMemo, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type AdminPayment, type AdminUser, type Prediction } from "../services/api";

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminPage() {
  const [items, setItems] = useState<Prediction[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = () => {
    Promise.all([api.adminPredictions(), api.adminUsers(), api.adminPayments()])
      .then(([predictions, usersData, paymentsData]) => {
        setItems(predictions);
        setUsers(usersData);
        setPayments(paymentsData);
      })
      .catch(() => setMessage("Доступ запрещен или данные недоступны"));
  };

  useEffect(() => {
    load();
  }, []);

  const editingItem = useMemo(() => items.find((item) => item.id === editId) || null, [items, editId]);

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminCreatePrediction({
        title: formData.get("title"),
        match_name: formData.get("match_name"),
        league: formData.get("league"),
        sport_type: formData.get("sport_type"),
        event_start_at: formData.get("event_start_at"),
        signal_type: formData.get("signal_type"),
        odds: Number(formData.get("odds")),
        short_description: formData.get("short_description"),
        risk_level: formData.get("risk_level"),
        access_level: formData.get("access_level"),
        mode: formData.get("mode"),
        publish_now: true,
      });
      setMessage("Прогноз добавлен");
      e.currentTarget.reset();
      load();
    } catch {
      setMessage("Ошибка создания прогноза");
    }
  };

  const onStatusChange = async (id: string, status: string) => {
    try {
      await api.adminUpdatePrediction(id, { status });
      setMessage("Статус обновлен");
      load();
    } catch {
      setMessage("Ошибка обновления статуса");
    }
  };

  const onStartEdit = (id: string) => {
    setEditId(id);
    setMessage("");
  };

  const onEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminUpdatePrediction(editId, {
        title: formData.get("e_title"),
        match_name: formData.get("e_match_name"),
        league: formData.get("e_league"),
        sport_type: formData.get("e_sport_type"),
        event_start_at: formData.get("e_event_start_at"),
        signal_type: formData.get("e_signal_type"),
        odds: Number(formData.get("e_odds")),
        short_description: formData.get("e_short_description"),
        risk_level: formData.get("e_risk_level"),
        access_level: formData.get("e_access_level"),
        mode: formData.get("e_mode"),
        publish_now: formData.get("e_publish_now") === "on",
      });
      setMessage("Прогноз обновлен");
      setEditId(null);
      load();
    } catch {
      setMessage("Ошибка обновления прогноза");
    }
  };

  const onBroadcast = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await api.adminBroadcast({
        title: String(formData.get("b_title") || ""),
        message: String(formData.get("b_message") || ""),
        access_level: String(formData.get("b_access_level") || "free"),
      });
      setMessage(`Рассылка поставлена в очередь: ${res.queued}`);
      e.currentTarget.reset();
    } catch {
      setMessage("Ошибка рассылки");
    }
  };

  return (
    <Layout>
      <section className="card">
        <h2>Админка: прогнозы</h2>
        <form className="admin-form" onSubmit={onCreate}>
          <input name="title" placeholder="Заголовок" required />
          <input name="match_name" placeholder="Матч" required />
          <input name="league" placeholder="Лига" />
          <input name="sport_type" placeholder="Вид спорта" defaultValue="football" required />
          <input name="event_start_at" type="datetime-local" required />
          <input name="signal_type" placeholder="Тип сигнала" required />
          <input name="odds" type="number" min="1.01" step="0.01" defaultValue="1.8" required />
          <input name="risk_level" placeholder="risk: low/medium/high" defaultValue="medium" required />
          <input name="access_level" placeholder="access: free/premium/vip" defaultValue="free" required />
          <input name="mode" placeholder="mode: prematch/live" defaultValue="prematch" required />
          <textarea name="short_description" placeholder="Краткое описание" rows={3} />
          <button className="btn" type="submit">
            Добавить прогноз
          </button>
        </form>

        {message ? <p>{message}</p> : null}

        <div className="admin-list">
          {items.map((item) => (
            <article key={item.id} className="prediction-item">
              <strong>{item.title}</strong>
              <div>{item.match_name}</div>
              <div className="muted">
                {item.access_level.toUpperCase()} • {item.status} • кф {item.odds}
              </div>
              <div className="row">
                <select defaultValue={item.status} onChange={(e) => onStatusChange(item.id, e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="won">won</option>
                  <option value="lost">lost</option>
                  <option value="refund">refund</option>
                </select>
              </div>
              <div className="row">
                <button className="btn" type="button" onClick={() => onStartEdit(item.id)}>
                  Редактировать
                </button>
              </div>
            </article>
          ))}
        </div>

        {editingItem ? (
          <>
            <h3>Редактирование прогноза</h3>
            <form className="admin-form" onSubmit={onEdit}>
              <input name="e_title" defaultValue={editingItem.title} required />
              <input name="e_match_name" defaultValue={editingItem.match_name} required />
              <input name="e_league" defaultValue={editingItem.league || ""} />
              <input name="e_sport_type" defaultValue={editingItem.sport_type} required />
              <input name="e_event_start_at" type="datetime-local" defaultValue={toLocalInput(editingItem.event_start_at)} required />
              <input name="e_signal_type" defaultValue={editingItem.signal_type} required />
              <input name="e_odds" type="number" step="0.01" min="1.01" defaultValue={editingItem.odds} required />
              <input name="e_risk_level" defaultValue={editingItem.risk_level} required />
              <input name="e_access_level" defaultValue={editingItem.access_level} required />
              <input name="e_mode" defaultValue={editingItem.mode} required />
              <textarea name="e_short_description" rows={3} defaultValue={editingItem.short_description || ""} />
              <label className="muted">
                <input name="e_publish_now" type="checkbox" /> Опубликовать сейчас
              </label>
              <button className="btn" type="submit">
                Сохранить изменения
              </button>
            </form>
          </>
        ) : null}

        <h3>Ручная рассылка</h3>
        <form className="admin-form" onSubmit={onBroadcast}>
          <input name="b_title" placeholder="Заголовок" required />
          <textarea name="b_message" placeholder="Текст уведомления" rows={3} required />
          <input name="b_access_level" placeholder="free / premium / vip" defaultValue="free" required />
          <button className="btn" type="submit">
            Отправить в очередь
          </button>
        </form>

        <h3>Пользователи</h3>
        <div className="admin-list">
          {users.map((user) => (
            <article key={user.id} className="prediction-item">
              <strong>{user.first_name || "-"}</strong>
              <div className="muted">
                @{user.username || "-"} • tg:{user.telegram_id} • role:{user.role}
              </div>
              <div className="muted">
                тариф: {user.tariff.toUpperCase()} • до: {user.subscription_ends_at || "-"}
              </div>
            </article>
          ))}
        </div>

        <h3>Платежи</h3>
        <div className="admin-list">
          {payments.length === 0 ? <p className="muted">Платежей пока нет</p> : null}
          {payments.map((payment) => (
            <article key={payment.id} className="prediction-item">
              <strong>{payment.tariff_code.toUpperCase()} • {payment.amount_rub} RUB</strong>
              <div className="muted">
                @{payment.username || "-"} • tg:{payment.telegram_id} • {payment.status}
              </div>
              <div className="muted">order: {payment.provider_order_id}</div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
