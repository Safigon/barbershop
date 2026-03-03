import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmApi } from '../../utils/crmApi';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 30;

  const load = useCallback(() => {
    setLoading(true);
    crmApi.getClients({ search, page, limit: LIMIT })
      .then(data => { setClients(data.clients); setTotal(data.total); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="crm-page-header">
        <h1 className="crm-page-title">База клиентов</h1>
        <span style={{ fontSize: 13, color: 'var(--crm-text3)' }}>{total} клиентов</span>
      </div>

      <div className="crm-filters">
        <div className="crm-search">
          <span className="crm-search__icon">🔍</span>
          <input
            className="crm-form-input"
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={handleSearch}
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>

      {loading ? (
        <div className="crm-loading"><div className="crm-spinner" /><div>Загрузка...</div></div>
      ) : (
        <>
          <div className="crm-table-wrap">
            {clients.length === 0 ? (
              <div className="crm-empty">Клиенты не найдены</div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Визитов</th>
                    <th>Последний визит</th>
                    <th>Потрачено</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/crm/clients/${c.id}`)}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ color: 'var(--crm-text3)', fontSize: 13 }}>{c.phone}</td>
                      <td style={{ color: 'var(--crm-text3)', fontSize: 13 }}>{c.email || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{c.visit_count}</td>
                      <td style={{ fontSize: 13, color: 'var(--crm-text2)' }}>
                        {c.last_visit
                          ? new Date(c.last_visit + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={{ color: 'var(--crm-gold)', fontWeight: 600 }}>
                        {parseFloat(c.total_spent).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="crm-pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
