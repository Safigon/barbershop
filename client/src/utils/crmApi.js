const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const CRM_BASE = BASE.replace('/api', '') + '/crm';

function getToken() {
  return localStorage.getItem('crm_token');
}

async function request(method, path, body) {
  const res = await fetch(CRM_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const crmApi = {
  login: (login, password) => request('POST', '/auth/login', { login, password }),
  me: () => request('GET', '/auth/me'),

  dashboard: () => request('GET', '/dashboard'),

  getAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', '/appointments' + (q ? '?' + q : ''));
  },
  createAppointment: (data) => request('POST', '/appointments', data),
  updateAppointment: (id, data) => request('PATCH', `/appointments/${id}`, data),
  deleteAppointment: (id) => request('DELETE', `/appointments/${id}`),

  getClients: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', '/clients' + (q ? '?' + q : ''));
  },
  getClient: (id) => request('GET', `/clients/${id}`),

  getMasters: () => request('GET', '/masters'),
  createMaster: (data) => request('POST', '/masters', data),
  updateMaster: (id, data) => request('PATCH', `/masters/${id}`, data),

  getServices: () => request('GET', '/services'),
  createService: (data) => request('POST', '/services', data),
  updateService: (id, data) => request('PATCH', `/services/${id}`, data),
  deleteService: (id) => request('DELETE', `/services/${id}`),

  getUsers: () => request('GET', '/users'),
  createUser: (data) => request('POST', '/users', data),
  updateUser: (id, data) => request('PATCH', `/users/${id}`, data),
  deleteUser: (id) => request('DELETE', `/users/${id}`),

  sendMailing: (data) => request('POST', '/mailing/send', data),
  getMailingLogs: () => request('GET', '/mailing/logs'),
};
