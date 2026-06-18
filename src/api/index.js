import axios from 'axios'

// Dev: bo'sh qoldiriladi -> '/api' (vite proxy ishlatadi)
// Prod: VITE_API_URL=https://api.example.com/api
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── Korxonalar ──────────────────────────────────────────────
export const korxonaAPI = {
  list: (params) => api.get('/korxonalar/', { params }),
  get: (id) => api.get(`/korxonalar/${id}/`),
  create: (data) => api.post('/korxonalar/', data),
  update: (id, data) => api.put(`/korxonalar/${id}/`, data),
  delete: (id) => api.delete(`/korxonalar/${id}/`),
}

// ── Mahsulot turlari ─────────────────────────────────────────
export const mahsulotAPI = {
  list: () => api.get('/mahsulot-turlari/'),
}

// ── Oylik hisobotlar ─────────────────────────────────────────
export const hisobotAPI = {
  list: (params) => api.get('/hisobotlar/', { params }),
  get: (id) => api.get(`/hisobotlar/${id}/`),
  create: (data) => api.post('/hisobotlar/', data),
  delete: (id) => api.delete(`/hisobotlar/${id}/`),
  pdfUrl: (id) => `${API_BASE}/hisobotlar/${id}/pdf/`,
  excelUrl: (id) => `${API_BASE}/hisobotlar/${id}/excel/`,
}

// ── Hisobot qatorlari ─────────────────────────────────────────
export const qatoriAPI = {
  list: (hisobotId) => api.get('/hisobot-qatorlari/', { params: { hisobot: hisobotId } }),
  update: (id, data) => api.put(`/hisobot-qatorlari/${id}/`, data),
  patch: (id, data) => api.patch(`/hisobot-qatorlari/${id}/`, data),
}

export default api
