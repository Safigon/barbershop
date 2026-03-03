import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMasters, getServices, getSlots, createAppointment } from '../utils/api';
import './BookingPage.css';

const STEPS = [
  { num: 1, label: 'Мастер' },
  { num: 2, label: 'Дата и время' },
  { num: 3, label: 'Услуга' },
  { num: 4, label: 'Ваши данные' },
];
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
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 0);
  return d.toISOString().split('T')[0];
}

function getMaxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split('T')[0];
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedMaster = searchParams.get('master');

  const [step, setStep] = useState(1);
  const [masters, setMasters] = useState([]);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedMaster, setSelectedMaster] = useState(preselectedMaster ? parseInt(preselectedMaster) : null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [dayOff, setDayOff] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', email: '', consent: false, sms: false });
  const [formErrors, setFormErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getMasters(), getServices()])
      .then(([m, s]) => { setMasters(m); setServices(s); setLoading(false); })
      .catch(() => { setApiError('Сервис временно недоступен. Позвоните нам для записи.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (preselectedMaster && masters.length > 0) {
      const found = masters.find(m => m.id === parseInt(preselectedMaster));
      if (found) setSelectedMaster(found.id);
    }
  }, [masters, preselectedMaster]);

  useEffect(() => {
    if (selectedMaster && selectedDate) {
      setSlotsLoading(true);
      setSelectedTime('');
      getSlots(selectedMaster, selectedDate)
        .then(data => {
          setSlots(data.slots || []);
          setDayOff(data.day_off || false);
          setSlotsLoading(false);
        })
        .catch(() => { setSlots([]); setSlotsLoading(false); });
    }
  }, [selectedMaster, selectedDate]);

  const masterObj = masters.find(m => m.id === selectedMaster);
  const serviceObj = services.find(s => s.id === selectedService);

  const canGoStep2 = !!selectedMaster;
  const canGoStep3 = !!selectedDate && !!selectedTime;
  const canGoStep4 = !!selectedService;

  function validateForm() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Введите ваше имя';
    if (!form.phone.trim()) errors.phone = 'Введите номер телефона';
    else if (form.phone.replace(/\D/g, '').length < 11) errors.phone = 'Некорректный номер';
    if (!form.consent) errors.consent = 'Необходимо согласие';
    return errors;
  }

  async function handleSubmit() {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setLoading(true);
    try {
      const res = await createAppointment({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        master_id: selectedMaster,
        service_id: selectedService,
        date: selectedDate,
        time: selectedTime,
        sms_reminder: form.sms,
      });
      setAppointmentId(res.appointment_id);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка записи. Попробуйте ещё раз или позвоните нам.';
      setFormErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  }

  if (apiError) {
    return (
      <div className="booking-page">
        <div className="page-hero"><div className="container">
          <h1 className="section-title">ЗАПИСЬ<br />ОНЛАЙН</h1>
        </div></div>
        <div className="container booking__error">
          <div className="booking__error-icon">⚠</div>
          <h3>{apiError}</h3>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>г. Москва, ул. Барберская, 15</p>
          <a href="tel:+79991234567" className="btn btn-gold" style={{ marginTop: 24 }}>
            Позвонить нам
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="booking-page">
        <div className="booking__success fade-in">
          <div className="booking__success-icon">✓</div>
          <h2 className="booking__success-title">ВЫ ЗАПИСАНЫ!</h2>
          <p className="serif booking__success-sub">Ждём вас в нашем барбершопе</p>
          <div className="booking__success-details">
            <div className="booking__success-row">
              <span>Мастер</span><span>{masterObj?.name}</span>
            </div>
            <div className="booking__success-row">
              <span>Услуга</span><span>{serviceObj?.name}</span>
            </div>
            <div className="booking__success-row">
              <span>Дата</span><span>{formatDate(selectedDate)}</span>
            </div>
            <div className="booking__success-row">
              <span>Время</span><span>{selectedTime}</span>
            </div>
            <div className="booking__success-row">
              <span>Стоимость</span><span>₽{serviceObj?.price?.toLocaleString('ru-RU')}</span>
            </div>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 16 }}>
            № записи: {appointmentId}
          </p>
          <a href="/" className="btn btn-outline" style={{ marginTop: 32 }}>
            На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Онлайн-запись</div>
          <h1 className="section-title">ЗАПИСЬ<br />ОНЛАЙН</h1>
        </div>
      </div>

      <div className="container booking__container">
        {/* STEPS INDICATOR */}
        <div className="booking__steps">
          {STEPS.map((s, i) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  className={`booking__step ${active ? 'booking__step--active' : ''} ${done ? 'booking__step--done' : ''}`}
                  onClick={() => done && setStep(s.num)}
                  style={{ cursor: done ? 'pointer' : 'default' }}
                >
                  <div className="booking__step-num">
                    {done ? '✓' : s.num}
                  </div>
                  <span className="booking__step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`booking__step-line ${done ? 'booking__step-line--done' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP CONTENT */}
        <div className="booking__content">

          {/* STEP 1: MASTER */}
          {step === 1 && (
            <div className="booking__section fade-in">
              <h3 className="booking__section-title">Выберите мастера</h3>
              {loading ? (
                <div className="booking__loader"><div className="spinner" /></div>
              ) : (
                <div className="booking__masters">
                  {masters.map(m => (
                    <div
                      key={m.id}
                      className={`booking__master-card ${selectedMaster === m.id ? 'booking__master-card--selected' : ''}`}
                      onClick={() => setSelectedMaster(m.id)}
                    >
                      <div className="booking__master-photo">
                        <img src={m.photo_url} alt={m.name} />
                        {selectedMaster === m.id && <div className="booking__master-check">✓</div>}
                      </div>
                      <div className="booking__master-info">
                        <span className="booking__master-name">{m.name}</span>
                        <span className="tag" style={{ marginTop: 4 }}>{m.specialty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="booking__nav">
                <div />
                <button className="btn btn-gold" onClick={() => setStep(2)} disabled={!canGoStep2}>
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && (
            <div className="booking__section fade-in">
              <h3 className="booking__section-title">Выберите дату и время</h3>
              <p className="booking__section-sub">Мастер: <strong>{masterObj?.name}</strong></p>

              <div className="form-group" style={{ maxWidth: 280, marginBottom: 32 }}>
                <label className="form-label">Дата</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  min={getMinDate()}
                  max={getMaxDate()}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              {slotsLoading && <div className="booking__loader"><div className="spinner" /></div>}

              {!slotsLoading && selectedDate && dayOff && (
                <div className="booking__no-slots">
                  Мастер не работает в этот день. Выберите другую дату.
                </div>
              )}

              {!slotsLoading && selectedDate && !dayOff && slots.length === 0 && (
                <div className="booking__no-slots">
                  Нет свободного времени на эту дату. Попробуйте другой день.
                </div>
              )}

              {!slotsLoading && slots.length > 0 && (
                <div className="booking__slots">
                  <p className="form-label" style={{ marginBottom: 12 }}>Доступное время</p>
                  <div className="booking__slots-grid">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        className={`booking__slot ${selectedTime === slot ? 'booking__slot--selected' : ''}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="booking__nav">
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Назад</button>
                <button className="btn btn-gold" onClick={() => setStep(3)} disabled={!canGoStep3}>
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SERVICE */}
          {step === 3 && (
            <div className="booking__section fade-in">
              <h3 className="booking__section-title">Выберите услугу</h3>
              <p className="booking__section-sub">
                {masterObj?.name} · {formatDate(selectedDate)} в {selectedTime}
              </p>

              <div className="booking__services">
                {services.map(s => (
                  <div
                    key={s.id}
                    className={`booking__service-card ${selectedService === s.id ? 'booking__service-card--selected' : ''}`}
                    onClick={() => setSelectedService(s.id)}
                  >
                    <div className="booking__service-info">
                      <span className="booking__service-name">{s.name}</span>
                      <span className="booking__service-desc">{s.description}</span>
                      <span className="booking__service-dur">{s.duration_minutes} мин</span>
                    </div>
                    <span className="booking__service-price">₽{s.price.toLocaleString('ru-RU')}</span>
                    {selectedService === s.id && <div className="booking__service-check">✓</div>}
                  </div>
                ))}
              </div>

              <div className="booking__nav">
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Назад</button>
                <button className="btn btn-gold" onClick={() => setStep(4)} disabled={!canGoStep4}>
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FORM */}
          {step === 4 && (
            <div className="booking__section fade-in">
              <h3 className="booking__section-title">Ваши данные</h3>

              {/* Summary */}
              <div className="booking__summary">
                <div className="booking__summary-row"><span>Мастер</span><span>{masterObj?.name}</span></div>
                <div className="booking__summary-row"><span>Услуга</span><span>{serviceObj?.name}</span></div>
                <div className="booking__summary-row"><span>Дата</span><span>{formatDate(selectedDate)}</span></div>
                <div className="booking__summary-row"><span>Время</span><span>{selectedTime}</span></div>
                <div className="booking__summary-row booking__summary-row--total">
                  <span>Стоимость</span>
                  <span>₽{serviceObj?.price?.toLocaleString('ru-RU')}</span>
                </div>
              </div>

              <div className="booking__form">
                <div className="booking__form-row">
                  <div className="form-group">
                    <label className="form-label">Имя *</label>
                    <input
                      className="form-input"
                      placeholder="Как вас зовут?"
                      value={form.name}
                      onChange={e => { setForm(f => ({...f, name: e.target.value})); setFormErrors(f => ({...f, name: null})); }}
                    />
                    {formErrors.name && <span className="booking__field-error">{formErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Телефон *</label>
                    <input
                      className="form-input"
                      placeholder="+7 (9XX) XXX-XX-XX"
                      value={form.phone}
                      onKeyDown={e => {
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          const digits = form.phone.replace(/\D/g, '');
                          const newDigits = digits.slice(0, -1);
                          const masked = newDigits.length <= 1 ? '' : formatPhone(newDigits);
                          setForm(f => ({...f, phone: masked}));
                          setFormErrors(f => ({...f, phone: null}));
                        }
                      }}
                      onChange={e => {
                        const masked = formatPhone(e.target.value);
                        setForm(f => ({...f, phone: masked}));
                        setFormErrors(f => ({...f, phone: null}));
                      }}
                    />
                    {formErrors.phone && <span className="booking__field-error">{formErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email (необязательно)</label>
                  <input
                    className="form-input"
                    placeholder="your@email.com"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  />
                </div>

                <div className="booking__checkboxes">
                  <label className={`booking__checkbox-label ${formErrors.consent ? 'booking__checkbox-label--error' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={e => { setForm(f => ({...f, consent: e.target.checked})); setFormErrors(f => ({...f, consent: null})); }}
                    />
                    <span>Согласен(а) на обработку персональных данных *</span>
                  </label>

                  <label className="booking__checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.sms}
                      onChange={e => setForm(f => ({...f, sms: e.target.checked}))}
                    />
                    <span>Напомнить по SMS за 2 часа до записи</span>
                  </label>
                </div>

                {formErrors.submit && (
                  <div className="booking__submit-error">{formErrors.submit}</div>
                )}
              </div>

              <div className="booking__nav">
                <button className="btn btn-outline" onClick={() => setStep(3)}>← Назад</button>
                <button className="btn btn-gold" onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Записаться →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
