import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const FEATURES = [
  { icon: '✦', title: 'Классические стрижки', desc: 'От помпадура до undercut — исполним любой запрос с безупречной точностью' },
  { icon: '◈', title: 'Уход за бородой', desc: 'Моделирование, стрижка и нанесение масел. Борода, которой будут завидовать' },
  { icon: '◎', title: 'Королевское бритьё', desc: 'Горячее полотенце, опасная бритва и ощущение, которое остаётся навсегда' },
  { icon: '◇', title: 'Premium-уходы', desc: 'Маски, тоники, укладки с профессиональными продуктами ведущих брендов' },
];

const STATS = [
  { value: '8+', label: 'Лет на рынке' },
  { value: '3 000+', label: 'Довольных клиентов' },
  { value: '3', label: 'Мастера' },
  { value: '100%', label: 'Уверенность в результате' },
];

export default function HomePage() {
  const heroRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__lines" />
        </div>

        <div className="container hero__content">
          <div className={`hero__text ${visible ? 'hero__text--visible' : ''}`}>
            <div className="section-label">Барбершоп премиум-класса</div>
            <h1 className="hero__title">
              <span className="hero__title-line">BLADE</span>
              <span className="hero__title-line hero__title-line--gold">&amp;</span>
              <span className="hero__title-line">STYLE</span>
            </h1>
            <p className="hero__subtitle serif">
              Мужской стиль — это не случайность.<br />
              Это решение. Приходи — мы знаем, что делать.
            </p>
            <div className="hero__actions">
              <Link to="/booking" className="btn btn-gold">Записаться онлайн</Link>
              <Link to="/masters" className="btn btn-outline">Наши мастера</Link>
            </div>
          </div>

          <div className={`hero__badge ${visible ? 'hero__badge--visible' : ''}`}>
            <div className="hero__badge-inner">
              <span className="hero__badge-top">PREMIUM</span>
              <span className="hero__badge-main">BARBERSHOP</span>
              <div className="hero__badge-divider" />
              <span className="hero__badge-bottom">МОСКВА</span>
            </div>
          </div>
        </div>

        <div className="hero__scroll">
          <span>SCROLL</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container stats__grid">
          {STATS.map((s, i) => (
            <div className="stats__item" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="stats__value">{s.value}</span>
              <span className="stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="about">
        <div className="container about__inner">
          <div className="about__visual">
            <div className="about__img-frame">
              <div className="about__img-placeholder">
                <span>✂</span>
              </div>
              <div className="about__img-border" />
            </div>
          </div>
          <div className="about__text">
            <div className="section-label">О нас</div>
            <h2 className="section-title">МЫ<br />ЗНАЕМ<br />СТИЛЬ</h2>
            <div className="gold-line" />
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
              BLADE & STYLE — это не просто парикмахерская. Это место, где мужской образ
              выстраивается с нуля: от формы стрижки до завершающей укладки.
            </p>
            <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
              Наши мастера прошли обучение у лучших специалистов страны и постоянно 
              совершенствуют навыки. Мы работаем только с профессиональными инструментами 
              и препаратами ведущих брендов.
            </p>
            <Link to="/masters" className="btn btn-outline">Познакомиться с мастерами</Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>Что мы делаем</div>
            <h2 className="section-title">НАШИ<br />УСЛУГИ</h2>
          </div>
          <div className="features__grid">
            {FEATURES.map((f, i) => (
              <div className="features__item card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="features__icon">{f.icon}</div>
                <h3 className="features__title">{f.title}</h3>
                <p className="features__desc">{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/price" className="btn btn-outline">Полный прайс-лист</Link>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="cta-banner__bg" />
        <div className="container cta-banner__inner">
          <div className="section-label" style={{ justifyContent: 'center' }}>Онлайн-запись</div>
          <h2 className="cta-banner__title">ЗАБРОНИРУЙ<br />СВОЁ ВРЕМЯ</h2>
          <p className="serif cta-banner__sub">
            Запишись к мастеру за 2 минуты. Без звонков, без ожидания.
          </p>
          <Link to="/booking" className="btn btn-gold" style={{ fontSize: '14px', padding: '16px 48px' }}>
            Записаться онлайн → 
          </Link>
        </div>
      </section>
    </div>
  );
}
