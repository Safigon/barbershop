import React, { useState, useEffect } from 'react';
import { getSettings } from '../utils/api';
import './ContactsPage.css';

export default function ContactsPage() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="contacts-page">
      <div className="page-hero">
        <div className="container">
          <div className="section-label">Где нас найти</div>
          <h1 className="section-title">КОН-<br />ТАКТЫ</h1>
        </div>
      </div>

      <div className="container contacts__body">
        <div className="contacts__grid">
          <div className="contacts__info">
            <div className="contacts__block">
              <div className="section-label" style={{ marginBottom: 12 }}>Адрес</div>
              <p className="contacts__value">{settings.address || 'г. Москва, ул. Барберская, 15'}</p>
            </div>
            <div className="gold-line" />

            <div className="contacts__block">
              <div className="section-label" style={{ marginBottom: 12 }}>Телефон</div>
              <a href={`tel:${settings.phone}`} className="contacts__link contacts__value">
                {settings.phone || '+7 (999) 123-45-67'}
              </a>
            </div>
            <div className="gold-line" />

            <div className="contacts__block">
              <div className="section-label" style={{ marginBottom: 12 }}>Часы работы</div>
              <div className="contacts__schedule">
                <div className="contacts__schedule-row">
                  <span>Пн — Пт</span>
                  <span>{settings.open_from || '10:00'} — {settings.open_to || '21:00'}</span>
                </div>
                <div className="contacts__schedule-row">
                  <span>Суббота</span>
                  <span>{settings.open_from || '10:00'} — {settings.open_to || '21:00'}</span>
                </div>
                <div className="contacts__schedule-row contacts__schedule-row--off">
                  <span>Воскресенье</span>
                  <span>Выходной</span>
                </div>
              </div>
            </div>
            <div className="gold-line" />

            {settings.instagram && (
              <div className="contacts__block">
                <div className="section-label" style={{ marginBottom: 12 }}>Instagram</div>
                <a
                  href={`https://instagram.com/${settings.instagram?.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contacts__link"
                >
                  {settings.instagram}
                </a>
              </div>
            )}
          </div>

          <div className="contacts__map">
            <div className="contacts__map-placeholder">
              <div className="contacts__map-pin">📍</div>
              <p style={{ color: 'var(--text2)', marginTop: 12 }}>
                {settings.address || 'г. Москва, ул. Барберская, 15'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
                Карта подключается через API Яндекс.Карт / Google Maps
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
