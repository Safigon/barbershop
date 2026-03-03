import React, { useEffect, useState } from 'react';
import { crmApi } from '../../utils/crmApi';

export default function MailingPage() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ subject: '', body: '', segment: 'all' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    crmApi.getMailingLogs().then(setLogs);
  }, []);

  async function send() {
    if (!form.subject.trim() || !form.body.trim()) { setError('Заполните тему и текст письма'); return; }
    setError(''); setResult(null);
    setSending(true);
    try {
      const data = await crmApi.sendMailing(form);
      setResult(data.message);
      setForm({ subject: '', body: '', segment: 'all' });
      crmApi.getMailingLogs().then(setLogs);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">Рассылки</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Compose */}
        <div style={{ background: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Новая рассылка</h3>

          <div className="crm-form-group">
            <label className="crm-form-label">Сегмент получателей</label>
            <select className="crm-form-select" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
              <option value="all">Все клиенты с email</option>
              <option value="inactive_30">Не приходили более 30 дней</option>
            </select>
          </div>

          <div className="crm-form-group">
            <label className="crm-form-label">Тема письма *</label>
            <input className="crm-form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Скидка 20% для наших клиентов!" />
          </div>

          <div className="crm-form-group">
            <label className="crm-form-label">Текст письма *</label>
            <textarea className="crm-form-textarea" style={{ minHeight: 160 }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Привет! Хотим напомнить о себе и предложить специальную акцию..." />
          </div>

          <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: 'var(--crm-text3)', marginBottom: 16 }}>
            ℹ️ Письма отправляются только клиентам у которых заполнен email
          </div>

          {error && <div style={{ color: 'var(--crm-red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {result && <div style={{ color: 'var(--crm-green)', fontSize: 13, marginBottom: 12 }}>✓ {result}</div>}

          <button className="crm-btn crm-btn--gold" style={{ width: '100%', justifyContent: 'center' }} onClick={send} disabled={sending}>
            {sending ? 'Отправка...' : '📧 Отправить рассылку'}
          </button>
        </div>

        {/* Logs */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>История рассылок</h3>
          {logs.length === 0 ? (
            <div className="crm-empty">Рассылок ещё не было</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map(log => (
                <div key={log.id} style={{ background: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{log.subject}</span>
                    <span style={{ fontSize: 11, color: 'var(--crm-text3)' }}>
                      {new Date(log.sent_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--crm-text3)', display: 'flex', gap: 12 }}>
                    <span>Сегмент: {log.segment === 'all' ? 'Все' : 'Неактивные 30д'}</span>
                    <span>Получателей: <strong style={{ color: 'var(--crm-gold)' }}>{log.recipients_count}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
