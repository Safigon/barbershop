import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../utils/crmApi';
import { useAuth } from '../../components/crm/AuthContext';
const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00');
  return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0,3);
}

const STATUS_COLORS = {
  new: 'var(--crm-blue)',
  confirmed: 'var(--crm-gold)',
  done: 'var(--crm-green)',
  cancelled: 'var(--crm-text3)',
  no_show: 'var(--crm-orange)',
};

export default function SchedulePage() {
  const { user } = useAuth();
  const [view, setView] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState('all');

  const getRange = useCallback(() => {
    if (view === 'week') {
      const monday = getMonday(currentDate);
      const sunday = addDays(monday, 6);
      return { from: toYMD(monday), to: toYMD(sunday) };
    } else {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      const from = toYMD(new Date(y, m, 1));
      const to = toYMD(new Date(y, m + 1, 0));
      return { from, to };
    }
  }, [view, currentDate]);

  useEffect(() => {
    setLoading(true);
    const { from, to } = getRange();
    crmApi.getFullSchedule(from, to)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getRange]);

  function prev() {
    setCurrentDate(d => view === 'week' ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function next() {
    setCurrentDate(d => view === 'week' ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function goToday() { setCurrentDate(new Date()); }

  // Получить дни для текущего вида
  function getDays() {
    const { from, to } = getRange();
    const days = [];
    let d = new Date(from + 'T12:00');
    const end = new Date(to + 'T12:00');
    while (d <= end) {
      days.push(toYMD(d));
      d = addDays(d, 1);
    }
    return days;
  }

  // Проверить рабочий ли день для мастера
  function isWorking(master, dateStr) {
    if (!data) return false;
    const date = new Date(dateStr + 'T12:00');
    const dow = date.getDay() === 0 ? 6 : date.getDay() - 1; // 0=пн

    // Проверяем выходные даты
    const isDayOff = data.daysOff.some(d => d.master_id === master.id && d.date.slice(0,10) === dateStr);
    if (isDayOff) return false;

    // Проверяем расписание
    const sched = data.schedule.find(s => s.master_id === master.id && s.day_of_week === dow);
    return sched ? sched.is_working : false;
  }

  function getWorkHours(master, dateStr) {
    if (!data) return null;
    const date = new Date(dateStr + 'T12:00');
    const dow = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const sched = data.schedule.find(s => s.master_id === master.id && s.day_of_week === dow);
    if (!sched || !sched.is_working) return null;
    return sched.time_from?.slice(0,5) + ' – ' + sched.time_to?.slice(0,5);
  }

  function getAppointments(masterId, dateStr) {
    if (!data) return [];
    return data.appointments.filter(a =>
      a.master_id === masterId && a.appointment_date?.slice(0,10) === dateStr
    );
  }

  function isDayOff(masterId, dateStr) {
    if (!data) return false;
    return data.daysOff.some(d => d.master_id === masterId && d.date?.slice(0,10) === dateStr);
  }

  const masters = data?.masters || [];
  const filteredMasters = selectedMaster === 'all'
    ? masters
    : masters.filter(m => m.id === parseInt(selectedMaster));

  const days = data ? getDays() : [];
  const today = toYMD(new Date());

  // Заголовок периода
  function periodTitle() {
    if (view === 'week') {
      const { from, to } = getRange();
      return formatDate(from) + ' – ' + formatDate(to) + ' ' + new Date(from + 'T12:00').getFullYear();
    } else {
      return MONTH_NAMES[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
    }
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="crm-page-header">
        <h1 className="crm-page-title">Расписание</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Фильтр мастера */}
          <select
            className="crm-form-select"
            style={{ width: 'auto' }}
            value={selectedMaster}
            onChange={e => setSelectedMaster(e.target.value)}
          >
            <option value="all">Все мастера</option>
            {masters.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Переключатель вида */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={'crm-btn crm-btn--sm ' + (view === 'week' ? 'crm-btn--gold' : 'crm-btn--outline')}
              onClick={() => setView('week')}
            >Неделя</button>
            <button
              className={'crm-btn crm-btn--sm ' + (view === 'month' ? 'crm-btn--gold' : 'crm-btn--outline')}
              onClick={() => setView('month')}
            >Месяц</button>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={prev}>◀</button>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, minWidth: 220, textAlign: 'center' }}>
          {periodTitle()}
        </span>
        <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={next}>▶</button>
        <button className="crm-btn crm-btn--outline crm-btn--sm" onClick={goToday}>Сегодня</button>
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--crm-green)', label: 'Рабочий день' },
          { color: 'rgba(224,82,82,0.5)', label: 'Выходной' },
          { color: 'var(--crm-gold)', label: 'Запись' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--crm-text2)' }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="crm-loading"><div className="crm-spinner" /><div>Загрузка...</div></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: view === 'month' ? 900 : 700 }}>
            <thead>
              <tr>
                {/* Колонка мастера */}
                <th style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
                  color: 'var(--crm-text3)', background: 'var(--crm-surface2)',
                  border: '1px solid var(--crm-border)',
                  minWidth: 130, position: 'sticky', left: 0, zIndex: 2,
                }}>
                  Мастер
                </th>
                {days.map(dateStr => {
                  const isToday = dateStr === today;
                  const d = new Date(dateStr + 'T12:00');
                  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
                  return (
                    <th key={dateStr} style={{
                      padding: '8px 6px', textAlign: 'center',
                      fontSize: 11, color: isToday ? 'var(--crm-gold)' : 'var(--crm-text3)',
                      background: isToday ? 'rgba(201,168,76,0.08)' : 'var(--crm-surface2)',
                      border: '1px solid var(--crm-border)',
                      minWidth: view === 'month' ? 36 : 90,
                      borderBottom: isToday ? '2px solid var(--crm-gold)' : '1px solid var(--crm-border)',
                    }}>
                      <div style={{ fontWeight: 700 }}>{DAY_NAMES_SHORT[dow]}</div>
                      <div style={{ fontSize: 13, marginTop: 2 }}>{d.getDate()}</div>
                      {view === 'week' && (
                        <div style={{ fontSize: 10, marginTop: 1 }}>
                          {MONTH_NAMES[d.getMonth()].slice(0,3)}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredMasters.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--crm-text3)' }}>
                    Нет данных
                  </td>
                </tr>
              ) : filteredMasters.map(master => (
                <tr key={master.id}>
                  {/* Имя мастера */}
                  <td style={{
                    padding: '10px 14px',
                    border: '1px solid var(--crm-border)',
                    background: 'var(--crm-surface)',
                    position: 'sticky', left: 0, zIndex: 1,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{master.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--crm-text3)', marginTop: 2 }}>{master.specialty}</div>
                  </td>

                  {/* Дни */}
                  {days.map(dateStr => {
                    const working = isWorking(master, dateStr);
                    const dayOff = isDayOff(master.id, dateStr);
                    const hours = getWorkHours(master, dateStr);
                    const appts = getAppointments(master.id, dateStr);
                    const isToday = dateStr === today;
                    const d = new Date(dateStr + 'T12:00');
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                    let bgColor = 'var(--crm-surface)';
                    if (dayOff) bgColor = 'rgba(224,82,82,0.06)';
                    else if (!working) bgColor = isWeekend ? 'rgba(224,82,82,0.04)' : 'var(--crm-surface)';
                    else bgColor = 'rgba(82,183,136,0.04)';

                    return (
                      <td key={dateStr} style={{
                        padding: view === 'month' ? '4px' : '8px',
                        border: '1px solid var(--crm-border)',
                        background: isToday ? 'rgba(201,168,76,0.04)' : bgColor,
                        verticalAlign: 'top',
                        minWidth: view === 'month' ? 36 : 90,
                      }}>
                        {view === 'week' ? (
                          <>
                            {/* Вид недели — подробно */}
                            {dayOff ? (
                              <div style={{ fontSize: 11, color: 'var(--crm-red)', textAlign: 'center', padding: '4px 0' }}>
                                🚫 Выходной
                              </div>
                            ) : working ? (
                              <>
                                <div style={{ fontSize: 10, color: 'var(--crm-green)', marginBottom: 4, textAlign: 'center' }}>
                                  ✓ {hours}
                                </div>
                                {appts.map(a => (
                                  <div key={a.id} style={{
                                    fontSize: 10, padding: '2px 5px', borderRadius: 3,
                                    background: 'rgba(201,168,76,0.12)',
                                    borderLeft: '2px solid ' + (STATUS_COLORS[a.status] || 'var(--crm-gold)'),
                                    marginBottom: 2,
                                    color: 'var(--crm-text)',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  }}>
                                    {a.appointment_time?.slice(0,5)} {a.client_name}
                                  </div>
                                ))}
                                {appts.length === 0 && (
                                  <div style={{ fontSize: 10, color: 'var(--crm-text3)', textAlign: 'center' }}>
                                    свободно
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--crm-text3)', textAlign: 'center', padding: '4px 0' }}>
                                —
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Вид месяца — компактно */}
                            {dayOff ? (
                              <div style={{ width: '100%', height: 28, background: 'rgba(224,82,82,0.25)', borderRadius: 3 }} title="Выходной" />
                            ) : working ? (
                              <div style={{
                                width: '100%', height: 28,
                                background: appts.length > 0 ? 'rgba(201,168,76,0.3)' : 'rgba(82,183,136,0.2)',
                                borderRadius: 3,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: 'var(--crm-text2)',
                              }} title={hours + (appts.length ? ` · ${appts.length} зап.` : '')}>
                                {appts.length > 0 ? appts.length : ''}
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: 28 }} />
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
