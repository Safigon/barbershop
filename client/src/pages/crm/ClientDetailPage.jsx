import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { crmApi } from '../../utils/crmApi';

const STATUS_LABEL = {
  new: 'Новая', confirmed: 'Подтверждено', done: 'Выполнено',
  cancelled: 'Отменено', no_show: 'Не пришёл',
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmApi.getClient(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="crm-loading"><div className="crm-spinner" /><div>Загрузка...</div></div>;
  if (!data) return <div className="crm-empty">Клиент не найден</div>;

  const { client, history } = data;
  const totalSpent = history.filter(h => h.status === 'done').reduce((s, h) => s + parseFloat(h.price || 0), 0);

  return (
    <div>
      <div className="crm-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => navigate('/crm/clients')}>← Назад</button>
          <h1 className="crm-page-title">{client.name}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Client info card */}
        <div style={{ background: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--crm-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
            {client.name[0]}
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>{client.name}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--crm-text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Телефон</div>
              <div style={{ fontSize: 14 }}>{client.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--crm-text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Email</div>
              <div style={{ fontSize: 14 }}>{client.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--crm-text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Клиент с</div>
              <div style={{ fontSize: 14 }}>
                {new Date(client.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--crm-border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontFamily: "'Bebas Neue', sans-serif", color: 'var(--crm-gold)' }}>{history.filter(h => h.status === 'done').length}</div>
              <div style={{ fontSize: 11, color: 'var(--crm-text3)' }}>Визитов</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontFamily: "'Bebas Neue', sans-serif", color: 'var(--crm-gold)' }}>{totalSpent.toLocaleString('ru-RU')} ₽</div>
              <div style={{ fontSize: 11, color: 'var(--crm-text3)' }}>Потрачено</div>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>История визитов</h3>
          <div className="crm-table-wrap">
            {history.length === 0 ? (
              <div className="crm-empty">Визитов пока нет</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Время</th>
                    <th>Мастер</th>
                    <th>Услуга</th>
                    <th>Стоимость</th>
                    <th>Статус</th>
                    <th>Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.date + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ color: 'var(--crm-gold)' }}>{h.time}</td>
                      <td>{h.master_name}</td>
                      <td>{h.service_name}</td>
                      <td>{parseFloat(h.price).toLocaleString('ru-RU')} ₽</td>
                      <td><span className={`crm-badge crm-badge--${h.status}`}>{STATUS_LABEL[h.status]}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--crm-text3)' }}>{h.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
