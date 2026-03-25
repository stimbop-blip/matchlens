import { FormEvent, useEffect, useState } from "react";

import { Layout } from "../components/Layout";
import { api, type Prediction } from "../services/api";

export function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<Prediction[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPredictions = async () => {
    try {
      const data = await api.adminPredictions();
      setItems(data.slice(0, 20));
    } catch {
      setItems([]);
      setMessage("Не удалось загрузить прогнозы");
    }
  };

  useEffect(() => {
    api
      .me()
      .then((me) => {
        const allowed = Boolean(me.is_admin || me.role === "admin");
        setIsAdmin(allowed);
        if (allowed) {
          loadPredictions();
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setMessage("Не удалось проверить права администратора");
      });
  }, []);

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);

    const matchName = String(formData.get("match_name") || "").trim();
    const signalType = String(formData.get("signal_type") || "").trim();

    try {
      await api.adminCreatePrediction({
        title: `${matchName} • ${signalType}`,
        match_name: matchName,
        league: String(formData.get("league") || "").trim() || null,
        sport_type: String(formData.get("sport_type") || "football").trim(),
        event_start_at: formData.get("event_start_at"),
        signal_type: signalType,
        odds: Number(formData.get("odds")),
        risk_level: String(formData.get("risk_level") || "medium"),
        access_level: String(formData.get("access_level") || "free"),
        mode: String(formData.get("mode") || "prematch"),
        short_description: String(formData.get("short_description") || "").trim() || null,
        publish_now: true,
      });

      setMessage("Прогноз успешно добавлен");
      e.currentTarget.reset();
      await loadPredictions();
    } catch {
      setMessage("Ошибка: не удалось добавить прогноз");
    } finally {
      setLoading(false);
    }
  };

  const onStatusChange = async (id: string, status: string) => {
    try {
      await api.adminUpdatePrediction(id, { status });
      setMessage("Статус обновлен");
      await loadPredictions();
    } catch {
      setMessage("Ошибка: не удалось обновить статус");
    }
  };

  if (isAdmin === false) {
    return (
      <Layout>
        <section className="card">
          <h2>Админка</h2>
          <p>Доступ закрыт. Нужна роль администратора.</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="card">
        <h2>Админка</h2>
        <p className="muted">Ручное добавление прогнозов</p>

        <form className="admin-form" onSubmit={onCreate}>
          <input name="match_name" placeholder="Матч" required />
          <input name="league" placeholder="Лига" required />
          <input name="sport_type" placeholder="Вид спорта" defaultValue="football" required />
          <input name="event_start_at" type="datetime-local" required />
          <input name="signal_type" placeholder="Тип сигнала" required />
          <input name="odds" type="number" min="1.01" step="0.01" defaultValue="1.80" required />

          <select name="risk_level" defaultValue="medium" required>
            <option value="low">Риск: low</option>
            <option value="medium">Риск: medium</option>
            <option value="high">Риск: high</option>
          </select>

          <select name="access_level" defaultValue="free" required>
            <option value="free">Доступ: free</option>
            <option value="premium">Доступ: premium</option>
            <option value="vip">Доступ: vip</option>
          </select>

          <select name="mode" defaultValue="prematch" required>
            <option value="prematch">Режим: prematch</option>
            <option value="live">Режим: live</option>
          </select>

          <textarea name="short_description" placeholder="Краткое описание" rows={3} />

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Сохраняем..." : "Добавить прогноз"}
          </button>
        </form>

        {message ? <p style={{ marginTop: 10 }}>{message}</p> : null}

        <h3>Последние прогнозы</h3>
        <div className="admin-list">
          {items.length === 0 ? <p className="muted">Пока нет прогнозов</p> : null}
          {items.map((item) => (
            <article key={item.id} className="prediction-item">
              <strong>{item.match_name}</strong>
              <div className="muted">
                {item.sport_type} • {item.league || "-"} • кф {item.odds}
              </div>
              <div className="muted">
                {item.access_level.toUpperCase()} • {item.mode} • {item.status}
              </div>
              <div className="row">
                <select defaultValue={item.status} onChange={(e) => onStatusChange(item.id, e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="won">win</option>
                  <option value="lost">lose</option>
                  <option value="refund">refund</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
