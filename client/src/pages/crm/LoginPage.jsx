import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmApi } from '../../utils/crmApi';
import { useAuth } from '../../components/crm/AuthContext';
import '../../components/crm/CRM.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await crmApi.login(form.login, form.password);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/crm/dashboard' : '/crm/calendar');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #2e2e2e',
        borderRadius: 12, padding: '40px', width: '100%', maxWidth: 380,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✂</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 28, letterSpacing: 3,
            color: '#f0f0f0',
          }}>
            BBT <span style={{ color: '#c9a84c' }}>CRM</span>
          </div>
          <div style={{ fontSize: 13, color: '#606060', marginTop: 4 }}>Административная панель</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="crm-form-group">
            <label className="crm-form-label">Логин</label>
            <input
              className="crm-form-input"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              placeholder="admin"
              autoFocus
            />
          </div>
          <div className="crm-form-group">
            <label className="crm-form-label">Пароль</label>
            <input
              className="crm-form-input"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)',
              borderRadius: 6, padding: '10px 14px', fontSize: 13,
              color: '#e05252', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="crm-btn crm-btn--gold"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#404040' }}>
          По умолчанию: admin / admin123
        </div>
      </div>
    </div>
  );
}
