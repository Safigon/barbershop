import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/masters', label: 'Мастера' },
    { to: '/price', label: 'Прайс' },
    { to: '/contacts', label: 'Контакты' },
  ];

  return (
    <div className="site-wrapper">
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">
          <Link to="/" className="navbar__logo">
            <span className="navbar__logo-main">BLADE</span>
            <span className="navbar__logo-amp">&</span>
            <span className="navbar__logo-sub">STYLE</span>
          </Link>

          <nav className={`navbar__nav ${menuOpen ? 'navbar__nav--open' : ''}`}>
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar__right">
            <Link to="/booking" className="btn btn-gold navbar__cta">
              Записаться
            </Link>
            <button
              className={`navbar__burger ${menuOpen ? 'navbar__burger--open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Меню"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="navbar__mobile-menu fade-in">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/booking" className="btn btn-gold" style={{ marginTop: 16, justifyContent: 'center' }}
              onClick={() => setMenuOpen(false)}>
              Записаться онлайн
            </Link>
          </div>
        )}
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__logo">
            <span className="navbar__logo-main">BLADE</span>
            <span className="navbar__logo-amp"> & </span>
            <span className="navbar__logo-sub">STYLE</span>
          </div>
          <p className="footer__tagline serif" style={{ fontStyle: 'italic', color: 'var(--text3)', marginTop: 8 }}>
            Мужской стиль. Без компромиссов.
          </p>
          <div className="footer__links">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} className="footer__link">{l.label}</NavLink>
            ))}
          </div>
          <div className="footer__bottom">
            <span>© {new Date().getFullYear()} BLADE & STYLE</span>
            <span>Все права защищены</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
