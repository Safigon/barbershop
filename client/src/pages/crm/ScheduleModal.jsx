import React, { useEffect, useState } from 'react';
import { crmApi } from '../../utils/crmApi';

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const defaultSchedule = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  is_working: i < 5, // пн-пт рабочие по умолчанию
  time_from: '10:00',
  time_to: '20:00',
}));

export default function ScheduleModal({ master, onClose }) {
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [daysOff, setDaysOff] = useState([]);
  const [newDayOff, setNewDayOff] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [addingDayOff, setAddingDayOff] = useState(false);
  const [tab, setTab] = useState('week'); // 'week' | 'daysoff'

  useEffect(() => {
    crmApi.getSchedule(master.id).then(data => {
      if (data && data.length > 0) {
        // Мержим с дефолтом чтобы все 7 дней были
        const merged = defaultSchedule.map(def => {
          const found = data.find(d => d.day_of_week === def.day_of_week);
          return found ? {
            ...def,
            is_working: found.is_working,
            time_from: found.time_from?.slice(0, 5) || def.time_from,
            time_to: found.time_to?.slice(0, 5) || def.time_to,
          } : def;
        });
        setSchedule(merged);
      }
    }).catch(() => {});

    crmApi.getDaysOff(master.id).then(setDaysOff).catch(() => {});
  }, [master.id]);

  function updateDay(idx, field, value) {
    setSchedule(s => s.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  async function saveSchedule() {
    setSaving(true);
    try {
      await crmApi.saveSchedule(master.id, { schedule });
      alert('Расписание сохранено!');
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addDayOff() {
    if (!newDayOff.date) return;
    setAddingDayOff(true);
    try {
      await crmApi.addDayOff(master.id, newDayOff);
      const updated = await crmApi.getDaysOff(master.id);
      setDaysOff(updated);
      setNewDayOff({ date: '', reason: '' });
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingDayOff(false);
    }
  }

  async function removeDayOff(dayOffId) {
    try {
      await crmApi.deleteDayOff(master.id, dayOffId);
      setDaysOff(d => d.filter(x => x.id !== dayOffId));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="crm-modal__header">
          <span className="crm-modal__title">Расписание — {master.name}</span>
          <button className="crm-modal__close" onClick={onClose}>×</button>
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          <button
            className={'crm-btn crm-btn--sm ' + (tab === 'week' ? 'crm-btn--gold' : 'crm-btn--outline')}
            onClick={() => setTab('week')}
          >
            📅 Рабочие дни
          </button>
          <button
            className={'crm-btn crm-btn--sm ' + (tab === 'daysoff' ? 'crm-btn--gold' : 'crm-btn--outline')}
            onClick={() => setTab('daysoff')}
          >
            🚫 Выходные даты ({daysOff.length})
          </button>
        </div>

        {/* ТАБ: Рабочие дни */}
        {tab === 'week' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {schedule.map((day, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 1fr 1fr',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: day.is_working ? 'rgba(201,168,76,0.06)' : 'var(--crm-surface2)',
                  border: '1px solid ' + (day.is_working ? 'rgba(201,168,76,0.2)' : 'var(--crm-border)'),
                  borderRadius: 6,
                }}>
                  {/* День */}
                  <span style={{
                    fontWeight: 700, fontSize: 14,
                    color: day.is_working ? 'var(--crm-gold)' : 'var(--crm-text3)'
                  }}>
                    {DAY_NAMES[idx]}
                  </span>

                  {/* Тогл */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={day.is_working}
                      onChange={e => updateDay(idx, 'is_working', e.target.checked)}
                      style={{ accentColor: 'var(--crm-gold)', width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 13, color: day.is_working ? 'var(--crm-text)' : 'var(--crm-text3)' }}>
                      {day.is_working ? 'Рабочий' : 'Выходной'}
                    </span>
                  </label>

                  {/* Время от */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--crm-text3)' }}>С</span>
                    <input
                      type="time"
                      className="crm-form-input"
                      value={day.time_from}
                      disabled={!day.is_working}
                      onChange={e => updateDay(idx, 'time_from', e.target.value)}
                      style={{ padding: '6px 8px', opacity: day.is_working ? 1 : 0.3 }}
                    />
                  </div>

                  {/* Время до */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--crm-text3)' }}>До</span>
                    <input
                      type="time"
                      className="crm-form-input"
                      value={day.time_to}
                      disabled={!day.is_working}
                      onChange={e => updateDay(idx, 'time_to', e.target.value)}
                      style={{ padding: '6px 8px', opacity: day.is_working ? 1 : 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--outline" onClick={onClose}>Закрыть</button>
              <button className="crm-btn crm-btn--gold" onClick={saveSchedule} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить расписание'}
              </button>
            </div>
          </>
        )}

        {/* ТАБ: Выходные даты */}
        {tab === 'daysoff' && (
          <>
            {/* Добавить выходной */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr auto',
              gap: 10, marginBottom: 20, alignItems: 'end'
            }}>
              <div className="crm-form-group" style={{ marginBottom: 0 }}>
                <label className="crm-form-label">Дата</label>
                <input
                  type="date"
                  className="crm-form-input"
                  value={newDayOff.date}
                  onChange={e => setNewDayOff(d => ({ ...d, date: e.target.value }))}
                />
              </div>
              <div className="crm-form-group" style={{ marginBottom: 0 }}>
                <label className="crm-form-label">Причина (необязательно)</label>
                <input
                  className="crm-form-input"
                  placeholder="Отпуск, больничный..."
                  value={newDayOff.reason}
                  onChange={e => setNewDayOff(d => ({ ...d, reason: e.target.value }))}
                />
              </div>
              <button
                className="crm-btn crm-btn--gold"
                onClick={addDayOff}
                disabled={addingDayOff || !newDayOff.date}
              >
                + Добавить
              </button>
            </div>

            {/* Список выходных */}
            {daysOff.length === 0 ? (
              <div className="crm-empty">Выходных дат не добавлено</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {daysOff.map(d => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(224,82,82,0.06)',
                    border: '1px solid rgba(224,82,82,0.2)',
                    borderRadius: 6,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--crm-text)' }}>
                        {new Date(d.date + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {d.reason && (
                        <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--crm-text3)' }}>
                          {d.reason}
                        </span>
                      )}
                    </div>
                    <button
                      className="crm-btn crm-btn--danger crm-btn--sm"
                      onClick={() => removeDayOff(d.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--outline" onClick={onClose}>Закрыть</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
