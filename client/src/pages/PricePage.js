import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../utils/api';
import './PricePage.css';

export default function PricePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getServices()
      .then(data => { setServices(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="price-page">
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Стоимость услуг</div>
          <h1 className="section-title">ПРАЙС-<br />ЛИСТ</h1>
          <p className="serif" style={{ color: 'var(--text2)', fontStyle: 'italic', fontSize: 17 }}>
            Актуальные цены всегда синхронизированы с нашей системой
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
            Прайс-лист временно недоступен. Позвоните нам для уточнения цен.
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="price__table">
              <div className="price__header">
                <span>Услуга</span>
                <span>Время</span>
                <span>Цена</span>
              </div>
              {services.map((s, i) => (
                <div className="price__row" key={s.id} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="price__service">
                    <span className="price__service-name">{s.name}</span>
                    {s.description && (
                      <span className="price__service-desc">{s.description}</span>
                    )}
                  </div>
                  <span className="price__duration">{s.duration_minutes} мин</span>
                  <span className="price__amount">
                    <span className="price__currency">₽</span>
                    {s.price.toLocaleString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>

            <div className="price__note">
              <div className="section-label" style={{ marginBottom: 8 }}>Важно знать</div>
              <p>
                Стоимость может варьироваться в зависимости от сложности работы.
                Окончательная цена обсуждается с мастером перед началом процедуры.
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 36, marginBottom: 16 }}>
                ГОТОВЫ НАЧАТЬ?
              </h3>
              <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
                Запишитесь онлайн — это займёт всего 2 минуты
              </p>
              <Link to="/booking" className="btn btn-gold">
                Записаться онлайн
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
