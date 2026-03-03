import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './CRM.css';

const adminMenu = [
  { path: '/crm/dashboard', icon: '📊', label: 'Дашборд' },
  { path: '/crm/calendar', icon: '📅', label: 'Календарь' },
  { path: '/crm/clients', icon: '👥', label: 'Клиенты' },
  { path: '/crm/masters', icon: '✂️', label: 'Мастера' },
  { path: '/crm/services', icon: '💈', label: 'Услуги' },
  { path: '/crm/users', icon: '🔑', label: 'Сотрудники' },
  { path: '/crm/mailing', icon: '📧', label: 'Рассылки' },
];

const masterMenu = [
  { path: '/crm/calendar', icon: '📅', label: 'Мои записи' },
];

export default function CRMLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = user?.role === 'admin' ? adminMenu : masterMenu;

  function handleLogout() {
    logout();
    navigate('/crm/login');
  }

  return (
    <div className="crm-shell">
      {/* Sidebar */}
      <aside className={`crm-sidebar ${sidebarOpen ? 'crm-sidebar--open' : ''}`}>
        <div className="crm-sidebar__logo">
          <span className="crm-sidebar__logo-icon">✂</span>
          <span className="crm-sidebar__logo-text">BLADE <span>CRM</span></span>
        </div>

        <nav className="crm-nav">
          {menu.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `crm-nav__item ${isActive ? 'crm-nav__item--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="crm-nav__icon">{item.icon}</span>
              <span className="crm-nav__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="crm-sidebar__footer">
          <div className="crm-sidebar__user">
            <div className="crm-sidebar__user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="crm-sidebar__user-info">
              <span className="crm-sidebar__user-name">{user?.name}</span>
              <span className="crm-sidebar__user-role">
                {user?.role === 'admin' ? 'Администратор' : 'Мастер'}
              </span>
            </div>
          </div>
          <button className="crm-sidebar__logout" onClick={handleLogout} title="Выйти">
            ⏻
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="crm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="crm-main">
        <header className="crm-header">
          <button className="crm-header__burger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="crm-header__title">Barbershop CRM</div>
          <div className="crm-header__user">
            {user?.name} · {user?.role === 'admin' ? 'Администратор' : 'Мастер'}
          </div>
        </header>
        <div className="crm-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
