import React, { useState, useEffect, useRef } from 'react';
import { getSettings } from '../utils/api';
import './ContactsPage.css';

export default function ContactsPage() {
  const [settings, setSettings] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const address = settings.address || 'г. Уфа, Проспект Октября, 127';

    const initMap = () => {
      if (!window.ymaps || !mapRef.current || mapInstanceRef.current) return;

      window.ymaps.ready(() => {
        window.ymaps.geocode(address).then(res => {
          const coords = res.geoObjects.get(0).geometry.getCoordinates();

          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: coords,
            zoom: 16,
            controls: ['zoomControl'],
          });

          const placemark = new window.ymaps.Placemark(coords, {
            balloonContent: address,
          }, {
            preset: 'islands#darkOrangeIcon',
          });

          mapInstanceRef.current.geoObjects.add(placemark);
        });
      });
    };

    if (window.ymaps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=91fa8288-c508-4040-8a91-efd52ae3c52f&lang=ru_RU`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [settings.address]);

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
              <p className="contacts__value">{settings.address || 'г. Уфа, Проспект Октября, 127'}</p>
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
            <div
              ref={mapRef}
              style={{ width: '100%', minHeight: 400, border: '1px solid var(--border2)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
