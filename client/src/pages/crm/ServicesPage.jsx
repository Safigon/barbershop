import React, { useEffect, useState } from 'react';
import { crmApi } from '../../utils/crmApi';

const emptyForm = { name: '', description: '', price: '', duration_minutes: 30, active: true };

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    crmApi.getServices().then(setServices).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openAdd() { setForm(emptyForm); setError(''); setModal({ mode: 'add' }); }
  function openEdit(s) { setForm({ ...s }); setError(''); setModal({ mode: 'edit', id: s.id }); }

  async function save() {
    if (!form.name.trim() || !form.price) { setError('Заполните название и цену'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') await crmApi.createService(form);
      else await crmApi.updateService(modal.id, form);
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(id) {
    if (!window.confirm('Деактивировать услугу?')) return;
    await crmApi.deleteService(id);
    load();
  }

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">Услуги</h1>
        <button className="crm-btn crm-btn--gold" onClick={openAdd}>+ Добавить услугу</button>
      </div>

      {loading ? (
        <div className="crm-loading"><div className="crm-spinner" /></div>
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Цена</th>
                <th>Длительность</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ color: 'var(--crm-text3)', fontSize: 13 }}>{s.description || '—'}</td>
                  <td style={{ color: 'var(--crm-gold)', fontWeight: 600 }}>{parseFloat(s.price).toLocaleString('ru-RU')} ₽</td>
                  <td>{s.duration_minutes} мин</td>
                  <td>
                    <span className={`crm-badge ${s.active ? 'crm-badge--done' : 'crm-badge--cancelled'}`}>
                      {s.active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => openEdit(s)}>Изменить</button>
                      <button className="crm-btn crm-btn--danger crm-btn--sm" onClick={() => deleteService(s.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="crm-modal-overlay" onClick={() => setModal(null)}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal__header">
              <span className="crm-modal__title">{modal.mode === 'add' ? 'Новая услуга' : 'Редактировать услугу'}</span>
              <button className="crm-modal__close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Название *</label>
              <input className="crm-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Описание</label>
              <input className="crm-form-input" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="crm-form-group">
                <label className="crm-form-label">Цена (₽) *</label>
                <input type="number" className="crm-form-input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">Длительность (мин)</label>
                <input type="number" className="crm-form-input" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} />
              </div>
            </div>

            {error && <div style={{ color: 'var(--crm-red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--outline" onClick={() => setModal(null)}>Отмена</button>
              <button className="crm-btn crm-btn--gold" onClick={save} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
