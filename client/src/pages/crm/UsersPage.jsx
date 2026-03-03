import React, { useEffect, useState } from 'react';
import { crmApi } from '../../utils/crmApi';

const emptyForm = { login: '', password: '', name: '', role: 'master', master_id: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    Promise.all([crmApi.getUsers(), crmApi.getMasters()])
      .then(([u, m]) => { setUsers(u); setMasters(m); })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openAdd() { setForm(emptyForm); setError(''); setModal({ mode: 'add' }); }
  function openEdit(u) { setForm({ ...u, password: '' }); setError(''); setModal({ mode: 'edit', id: u.id }); }

  async function save() {
    if (!form.name.trim()) { setError('Введите имя'); return; }
    if (modal.mode === 'add' && (!form.login.trim() || !form.password)) { setError('Введите логин и пароль'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') await crmApi.createUser(form);
      else await crmApi.updateUser(modal.id, form);
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    await crmApi.updateUser(u.id, { active: !u.active });
    load();
  }

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">Сотрудники</h1>
        <button className="crm-btn crm-btn--gold" onClick={openAdd}>+ Добавить сотрудника</button>
      </div>

      {loading ? (
        <div className="crm-loading"><div className="crm-spinner" /></div>
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Логин</th>
                <th>Роль</th>
                <th>Мастер</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--crm-text3)' }}>{u.login}</td>
                  <td>
                    <span className={`crm-badge ${u.role === 'admin' ? 'crm-badge--confirmed' : 'crm-badge--new'}`}>
                      {u.role === 'admin' ? 'Администратор' : 'Мастер'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--crm-text3)' }}>
                    {u.master_id ? (masters.find(m => m.id === u.master_id)?.name || '—') : '—'}
                  </td>
                  <td>
                    <span className={`crm-badge ${u.active ? 'crm-badge--done' : 'crm-badge--cancelled'}`}>
                      {u.active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => openEdit(u)}>Изменить</button>
                      <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => toggleActive(u)}>
                        {u.active ? 'Деактивировать' : 'Активировать'}
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
              <span className="crm-modal__title">{modal.mode === 'add' ? 'Новый сотрудник' : 'Редактировать'}</span>
              <button className="crm-modal__close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="crm-form-group">
              <label className="crm-form-label">Имя *</label>
              <input className="crm-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            {modal.mode === 'add' && (
              <div className="crm-form-group">
                <label className="crm-form-label">Логин *</label>
                <input className="crm-form-input" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} />
              </div>
            )}
            <div className="crm-form-group">
              <label className="crm-form-label">{modal.mode === 'add' ? 'Пароль *' : 'Новый пароль (оставьте пустым чтобы не менять)'}</label>
              <input type="password" className="crm-form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Роль</label>
              <select className="crm-form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="master">Мастер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            {form.role === 'master' && (
              <div className="crm-form-group">
                <label className="crm-form-label">Привязать к мастеру</label>
                <select className="crm-form-select" value={form.master_id || ''} onChange={e => setForm(f => ({ ...f, master_id: e.target.value }))}>
                  <option value="">Не выбран</option>
                  {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}

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
