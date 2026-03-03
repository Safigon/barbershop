import React, { useEffect, useState } from 'react';
import { crmApi } from '../../utils/crmApi';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      crmApi.dashboard(),
      crmApi.getAppointments({ date: today, limit: 20 }),
    ]).then(([s, appts]) => {
      setStats(s);
      setTodayAppts(appts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusLabel = {
    new: 'Новая', confirmed: 'Подтверждено', done: 'Выполнено',
    cancelled: 'Отменено', no_show: 'Не пришёл',
  };

  if (loading) return (
    <div className="crm-loading"><div className="crm-spinner" /><div>Загрузка...</div></div>
  );

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">Дашборд</h1>
        <span style={{ fontSize: 13, color: 'var(--crm-text3)' }}>
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <div className="crm-stat-card__label">Записей сегодня</div>
          <div className="crm-stat-card__value">{stats?.today_appointments ?? 0}</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-card__label">Записей за месяц</div>
          <div className="crm-stat-card__value">{stats?.month_appointments ?? 0}</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-card__label">Всего клиентов</div>
          <div className="crm-stat-card__value">{stats?.total_clients ?? 0}</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-card__label">Выручка за месяц</div>
          <div className="crm-stat-card__value">
            {(stats?.month_revenue ?? 0).toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Записи на сегодня</h2>
        <span style={{ fontSize: 13, color: 'var(--crm-text3)' }}>{todayAppts.length} записей</span>
      </div>

      <div className="crm-table-wrap">
        {todayAppts.length === 0 ? (
          <div className="crm-empty">Записей на сегодня нет</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Клиент</th>
                <th>Мастер</th>
                <th>Услуга</th>
                <th>Статус</th>
                <th>Стоимость</th>
              </tr>
            </thead>
            <tbody>
              {todayAppts.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: 'var(--crm-gold)' }}>{a.time}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.client_name}</div>
                    {a.client_phone && <div style={{ fontSize: 12, color: 'var(--crm-text3)' }}>{a.client_phone}</div>}
                  </td>
                  <td>{a.master_name}</td>
                  <td>{a.service_name}</td>
                  <td>
                    <span className={`crm-badge crm-badge--${a.status}`}>
                      {statusLabel[a.status] || a.status}
                    </span>
                  </td>
                  <td>{a.price?.toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
