import React, { useEffect, useState } from 'react';
import { crmApi } from '../../utils/crmApi';

const emptyForm = { name: '', specialty: '', bio: '', photo_url: '', work_schedule: '5/2', active: true };

export default function MastersPage() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data: {} }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    crmApi.getMasters().then(setMasters).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openAdd() { setForm(emptyForm); setError(''); setModal({ mode: 'add' }); }
  function openEdit(m) { setForm({ ...m }); setError(''); setModal({ mode: 'edit', id: m.id }); }

  async function save() {
    if (!form.name.trim()) { setError('Введите имя'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') await crmApi.createMaster(form);
      else await crmApi.updateMaster(modal.id, form);
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m) {
    await crmApi.updateMaster(m.id, { active: !m.active });
    load();
  }

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">Мастера</h1>
        <button className="crm-btn crm-btn--gold" onClick={openAdd}>+ Добавить мастера</button>
      </div>

      {loading ? (
        <div className="crm-loading"><div className="crm-spinner" /></div>
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Мастер</th>
                <th>Специализация</th>
                <th>График</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {masters.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {m.photo_url
                        ? <img src={m.photo_url} alt={m.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--crm-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{m.name[0]}</div>
                      }
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--crm-text2)' }}>{m.specialty}</td>
                  <td><span className="crm-badge crm-badge--confirmed">{m.work_schedule}</span></td>
                  <td>
                    <span className={`crm-badge ${m.active ? 'crm-badge--done' : 'crm-badge--cancelled'}`}>
                      {m.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => openEdit(m)}>Изменить</button>
                      <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => toggleActive(m)}>
                        {m.active ? 'Деактивировать' : 'Активировать'}
                      </button>
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
              <span className="crm-modal__title">{modal.mode === 'add' ? 'Новый мастер' : 'Редактировать мастера'}</span>
              <button className="crm-modal__close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Имя *</label>
              <input className="crm-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Специализация</label>
              <input className="crm-form-input" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Барбер, Стилист..." />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">О мастере (для сайта)</label>
              <textarea className="crm-form-textarea" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">URL фотографии</label>
              <input className="crm-form-input" value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">График работы</label>
              <select className="crm-form-select" value={form.work_schedule} onChange={e => setForm(f => ({ ...f, work_schedule: e.target.value }))}>
                <option value="5/2">5/2 (пн-пт)</option>
                <option value="2/2">2/2</option>
                <option value="1/1">1/1</option>
                <option value="6/1">6/1</option>
                <option value="Индивидуальный">Индивидуальный</option>
              </select>
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
