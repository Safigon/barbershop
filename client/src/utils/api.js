import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

export const getMasters = () => api.get('/masters').then(r => r.data);
export const getServices = () => api.get('/services').then(r => r.data);
export const getSettings = () => api.get('/settings').then(r => r.data);
export const getSlots = (master_id, date) => api.get('/slots', { params: { master_id, date } }).then(r => r.data);
export const createAppointment = (data) => api.post('/appointments', data).then(r => r.data);
export const healthCheck = () => api.get('/health').then(r => r.data);

export default api;
