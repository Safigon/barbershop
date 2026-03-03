import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMasters } from '../utils/api';
import './MastersPage.css';

export default function MastersPage() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    getMasters()
      .then(data => { setMasters(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="masters-page">
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Команда</div>
          <h1 className="section-title">НАШИ<br />МАСТЕРА</h1>
          <p className="serif" style={{ color: 'var(--text2)', fontSize: 18, fontStyle: 'italic' }}>
            Каждый — профессионал с душой и историей
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
          <div className="masters-error">
            <p>Ведутся технические работы. Попробуйте позже.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="masters__grid">
            {masters.map((m, i) => (
              <div
                key={m.id}
                className={`master-card ${active === m.id ? 'master-card--active' : ''}`}
                style={{ animationDelay: `${i * 0.15}s` }}
                onClick={() => setActive(active === m.id ? null : m.id)}
              >
                <div className="master-card__photo">
                  <img src={m.photo_url} alt={m.name} loading="lazy" />
                  <div className="master-card__overlay">
                    <span className="master-card__cta">Записаться →</span>
                  </div>
                </div>
                <div className="master-card__body">
                  <div className="master-card__meta">
                    <span className="tag">{m.specialty}</span>
                    <span className="master-card__exp">{m.experience}</span>
                  </div>
                  <h3 className="master-card__name">{m.name}</h3>
                  <div className="gold-line" style={{ margin: '12px 0' }} />
                  <p className="master-card__desc">{m.description}</p>
                  <Link
                    to={`/booking?master=${m.id}`}
                    className="btn btn-outline"
                    style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                    onClick={e => e.stopPropagation()}
                  >
                    Записаться к {m.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && masters.length === 0 && (
          <p style={{ color: 'var(--text2)', textAlign: 'center', padding: '60px 0' }}>
            Информация о мастерах временно недоступна
          </p>
        )}
      </div>
    </div>
  );
}
