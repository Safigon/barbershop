import React, { useEffect, useState, useCallback } from 'react';
import { crmApi } from '../../utils/crmApi';
import { useAuth } from '../../components/crm/AuthContext';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новая' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'done', label: 'Выполнено' },
  { value: 'no_show', label: 'Не пришёл' },
  { value: 'cancelled', label: 'Отменено' },
];

const STATUS_LABEL = {
  new: 'Новая', confirmed: 'Подтверждено', done: 'Выполнено',
  cancelled: 'Отменено', no_show: 'Не пришёл',
};

function getWeekDates(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return dd;
  });
}

function fmtDate(d) {
  return d.toISOString().split('T')[0];
}

function getNow() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes() < 30 ? '00' : '30';
  return { date, time: h + ':' + m };
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  let d = digits;
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  let result = '+7';
  if (d.length > 1) result += ' (' + d.slice(1, 4);
  if (d.length >= 4) result += ') ' + d.slice(4, 7);
  if (d.length >= 7) result += '-' + d.slice(7, 9);
  if (d.length >= 9) result += '-' + d.slice(9, 11);
  return result;
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function CalendarPage() {
  const { user } = useAuth();
  const [baseDate, setBaseDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [masters, setMasters] = useState([]);
  const [services, setServices] = useState([]);
  const [filterMaster, setFilterMaster] = useState('');
  const [selected, setSelected] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', master_id: '', service_id: '', date: getNow().date, time: getNow().time, notes: '' });
  const [newError, setNewError] = useState('');
  const [view, setView] = useState('week');

  const weekDates = getWeekDates(baseDate);

  const load = useCallback(() => {
    const params = {};
    if (filterMaster) params.master_id = filterMaster;
    crmApi.getAppointments({ ...params, limit: 200 }).then(setAppointments).catch(() => {});
  }, [filterMaster]);

  useEffect(() => {
    load();
    if (user?.role === 'admin') {
      crmApi.getMasters().then(setMasters).catch(() => {});
      crmApi.getServices().then(setServices).catch(() => {});
    }
  }, [load, user]);

  function prevWeek() { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); }
  function nextWeek() { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); }
  function goToday() { setBaseDate(new Date()); }

  function selectAppointment(a) {
    setSelected(a);
    setEditStatus(a.status);
    setEditNotes(a.notes || '');
  }

  // ── Быстрое подтверждение одной кнопкой ──────────────────────
  async function quickConfirm(e, apptId) {
    e.stopPropagation();
    setConfirming(apptId);
    try {
      await crmApi.updateAppointment(apptId, { status: 'confirmed' });
      load();
      if (selected?.id === apptId) {
        setSelected(prev => ({ ...prev, status: 'confirmed' }));
        setEditStatus('confirmed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirming(null);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await crmApi.updateAppointment(selected.id, { status: editStatus, notes: editNotes });
      setSelected(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function cancelAppointment() {
    if (!window.confirm('Отменить запись?')) return;
    await crmApi.deleteAppointment(selected.id);
    setSelected(null);
    load();
  }

  async function createAppointment() {
    setNewError('');
    if (!newForm.master_id || !newForm.service_id || !newForm.date || !newForm.time) {
      setNewError('Выберите мастера, услугу, дату и время'); return;
    }
    const submitData = { ...newForm, name: newForm.name.trim() || 'Клиент', phone: newForm.phone.trim() || ('anon_' + Date.now()) };
    try {
      await crmApi.createAppointment(submitData);
      setShowNewModal(false);
      setNewForm({ name: '', phone: '', master_id: '', service_id: '', date: getNow().date, time: getNow().time, notes: '' });
      load();
    } catch (e) { setNewError(e.message); }
  }

  const byDate = {};
  weekDates.forEach(d => { byDate[fmtDate(d)] = []; });
  appointments.forEach(a => {
    const dateKey = a.appointment_date ? a.appointment_date.split('T')[0] : (a.date || '');
    if (byDate[dateKey] !== undefined) byDate[dateKey].push(a);
  });

  const today = fmtDate(new Date());

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">Календарь</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={'crm-btn crm-btn--sm ' + (view === 'week' ? 'crm-btn--gold' : 'crm-btn--outline')} onClick={() => setView('week')}>Неделя</button>
            <button className={'crm-btn crm-btn--sm ' + (view === 'list' ? 'crm-btn--gold' : 'crm-btn--outline')} onClick={() => setView('list')}>Список</button>
          </div>
          {user?.role === 'admin' && (
            <button className="crm-btn crm-btn--gold crm-btn--sm" onClick={() => setShowNewModal(true)}>+ Новая запись</button>
          )}
        </div>
      </div>

      <div className="crm-filters">
        <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={prevWeek}>←</button>
        <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={goToday}>Сегодня</button>
        <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={nextWeek}>→</button>
        <span style={{ fontSize: 14, color: 'var(--crm-text2)', padding: '0 8px' }}>
          {weekDates[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {user?.role === 'admin' && masters.length > 0 && (
          <select className="crm-form-select" style={{ maxWidth: 180 }} value={filterMaster} onChange={e => setFilterMaster(e.target.value)}>
            <option value="">Все мастера</option>
            {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {/* ── ВИД: НЕДЕЛЯ ─────────────────────────────────────── */}
      {view === 'week' && (
        <div className="crm-calendar-grid">
          {weekDates.map((d, i) => {
            const dateStr = fmtDate(d);
            const dayAppts = (byDate[dateStr] || []).sort((a, b) =>
              (a.appointment_time || a.time || '').localeCompare(b.appointment_time || b.time || '')
            );
            return (
              <div key={dateStr} className={'crm-cal-day' + (dateStr === today ? ' crm-cal-day--today' : '')}>
                <div className="crm-cal-day__header">{DAY_NAMES[i]}</div>
                <div className="crm-cal-day__num">{d.getDate()}</div>
                {dayAppts.map(a => (
                  <div
                    key={a.id}
                    className={'crm-appointment-chip crm-appointment-chip--' + a.status}
                    onClick={() => selectAppointment(a)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.appointment_time || a.time} {a.client_name}
                    </span>
                    {a.status === 'new' && (
                      <button
                        title="Подтвердить оказание услуги"
                        onClick={(e) => quickConfirm(e, a.id)}
                        disabled={confirming === a.id}
                        style={{
                          flexShrink: 0, padding: '1px 5px', fontSize: 11,
                          background: 'rgba(39,174,96,0.85)', color: '#fff',
                          border: 'none', borderRadius: 3, cursor: 'pointer',
                          fontWeight: 700, lineHeight: 1.5,
                        }}
                      >
                        {confirming === a.id ? '…' : '✓'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ВИД: СПИСОК ─────────────────────────────────────── */}
      {view === 'list' && (
        <div className="crm-table-wrap">
          {appointments.length === 0 ? (
            <div className="crm-empty">Записей не найдено</div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Дата</th><th>Время</th><th>Клиент</th>
                  {user?.role === 'admin' && <th>Телефон</th>}
                  <th>Мастер</th><th>Услуга</th><th>Статус</th><th>Сумма</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => selectAppointment(a)}>
                    <td>{new Date((a.appointment_date || a.date) + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</td>
                    <td style={{ color: 'var(--crm-gold)', fontWeight: 600 }}>{a.appointment_time || a.time}</td>
                    <td>{a.client_name}</td>
                    {user?.role === 'admin' && <td style={{ color: 'var(--crm-text3)', fontSize: 13 }}>{a.client_phone}</td>}
                    <td>{a.master_name}</td>
                    <td>{a.service_name}</td>
                    <td><span className={'crm-badge crm-badge--' + a.status}>{STATUS_LABEL[a.status]}</span></td>
                    <td>{a.price?.toLocaleString('ru-RU')} ₽</td>
                    <td onClick={e => e.stopPropagation()}>
                      {a.status === 'new' && (
                        <button
                          disabled={confirming === a.id}
                          onClick={(e) => quickConfirm(e, a.id)}
                          style={{
                            padding: '4px 10px', fontSize: 12,
                            background: 'rgba(39,174,96,0.12)', color: '#27ae60',
                            border: '1px solid rgba(39,174,96,0.35)',
                            borderRadius: 4, cursor: 'pointer',
                            fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        >
                          {confirming === a.id ? '...' : '✓ Подтвердить'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── МОДАЛКА: ДЕТАЛИ ЗАПИСИ ───────────────────────────── */}
      {selected && (
        <div className="crm-modal-overlay" onClick={() => setSelected(null)}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal__header">
              <span className="crm-modal__title">Запись #{selected.id}</span>
              <button className="crm-modal__close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="crm-appt-detail">
              <div className="crm-appt-detail__row"><span className="crm-appt-detail__key">Клиент</span><span>{selected.client_name}</span></div>
              {selected.client_phone && <div className="crm-appt-detail__row"><span className="crm-appt-detail__key">Телефон</span><span>{selected.client_phone}</span></div>}
              <div className="crm-appt-detail__row"><span className="crm-appt-detail__key">Мастер</span><span>{selected.master_name}</span></div>
              <div className="crm-appt-detail__row"><span className="crm-appt-detail__key">Услуга</span><span>{selected.service_name}</span></div>
              <div className="crm-appt-detail__row">
                <span className="crm-appt-detail__key">Дата и время</span>
                <span>{new Date((selected.appointment_date || selected.date) + 'T12:00').toLocaleDateString('ru-RU')} в {selected.appointment_time || selected.time}</span>
              </div>
              <div className="crm-appt-detail__row">
                <span className="crm-appt-detail__key">Стоимость</span>
                <span style={{ color: 'var(--crm-gold)' }}>{selected.price?.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>

            {/* Баннер подтверждения — только для статуса new */}
            {editStatus === 'new' && (
              <div style={{
                margin: '16px 0 4px', padding: '12px 16px',
                background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.3)',
                borderRadius: 6, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: 'var(--crm-text2)' }}>Услуга ещё не подтверждена</span>
                <button
                  disabled={confirming === selected.id}
                  onClick={(e) => quickConfirm(e, selected.id)}
                  style={{
                    padding: '6px 18px', fontSize: 13, fontWeight: 700,
                    background: '#27ae60', color: '#fff', border: 'none',
                    borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {confirming === selected.id ? 'Подтверждаю...' : '✓ Подтвердить оказание услуги'}
                </button>
              </div>
            )}

            <div className="crm-form-group" style={{ marginTop: 12 }}>
              <label className="crm-form-label">Статус</label>
              <select className="crm-form-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Комментарий</label>
              <textarea className="crm-form-textarea" value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Заметка к записи..." style={{ minHeight: 70 }} />
            </div>
            <div className="crm-modal__footer">
              {user?.role === 'admin' && (
                <button className="crm-btn crm-btn--danger crm-btn--sm" onClick={cancelAppointment}>Отменить запись</button>
              )}
              <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={() => setSelected(null)}>Закрыть</button>
              <button className="crm-btn crm-btn--gold crm-btn--sm" onClick={saveChanges} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── МОДАЛКА: НОВАЯ ЗАПИСЬ ────────────────────────────── */}
      {showNewModal && (
        <div className="crm-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal__header">
              <span className="crm-modal__title">Новая запись</span>
              <button className="crm-modal__close" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Имя клиента <span style={{ color: 'var(--crm-text3)', fontSize: 11 }}>(необязательно)</span></label>
              <input className="crm-form-input" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Клиент" />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Телефон <span style={{ color: 'var(--crm-text3)', fontSize: 11 }}>(необязательно)</span></label>
              <input
                className="crm-form-input" value={newForm.phone} placeholder="+7 (9XX) XXX-XX-XX"
                onKeyDown={e => {
                  if (e.key === 'Backspace') {
                    e.preventDefault();
                    const digits = newForm.phone.replace(/\D/g, '');
                    const masked = digits.length <= 1 ? '' : formatPhone(digits.slice(0, -1));
                    setNewForm(f => ({ ...f, phone: masked }));
                  }
                }}
                onChange={e => setNewForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
              />
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Мастер *</label>
              <select className="crm-form-select" value={newForm.master_id} onChange={e => setNewForm(f => ({ ...f, master_id: e.target.value }))}>
                <option value="">Выберите мастера</option>
                {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Услуга *</label>
              <select className="crm-form-select" value={newForm.service_id} onChange={e => setNewForm(f => ({ ...f, service_id: e.target.value }))}>
                <option value="">Выберите услугу</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price} руб.</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="crm-form-group">
                <label className="crm-form-label">Дата *</label>
                <input type="date" className="crm-form-input" value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="crm-form-group">
                <label className="crm-form-label">Время *</label>
                <input type="time" className="crm-form-input" value={newForm.time} onChange={e => setNewForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="crm-form-group">
              <label className="crm-form-label">Заметка</label>
              <input className="crm-form-input" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {newError && (
              <div style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#e05252', marginBottom: 12 }}>
                {newError}
              </div>
            )}
            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--outline" onClick={() => setShowNewModal(false)}>Отмена</button>
              <button className="crm-btn crm-btn--gold" onClick={createAppointment}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}