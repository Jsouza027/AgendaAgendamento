import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : 'http://localhost:8080';
const api = axios.create({ baseURL: backendUrl + '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const clientesAPI = {
  listar: () => api.get('/clientes'),
  listarPaginado: (busca = '', page = 0, size = 10) =>
    api.get(`/clientes/paginado?busca=${encodeURIComponent(busca)}&page=${page}&size=${size}`),
  buscar: (nome) => api.get(`/clientes/buscar?nome=${nome}`),
  criar: (data) => api.post('/clientes', data),
  atualizar: (id, data) => api.put(`/clientes/${id}`, data),
  deletar: (id) => api.delete(`/clientes/${id}`),
  historico: (id) => api.get(`/clientes/${id}/historico`),
};

export const procedimentosAPI = {
  listar: () => api.get('/procedimentos'),
  criar: (data) => api.post('/procedimentos', data),
  atualizar: (id, data) => api.put(`/procedimentos/${id}`, data),
  deletar: (id) => api.delete(`/procedimentos/${id}`),
};

export const profissionaisAPI = {
  listar: () => api.get('/profissionais'),
  todos: () => api.get('/profissionais/todos'),
  buscar: (id) => api.get(`/profissionais/${id}`),
  porProcedimento: (procedimentoId) => api.get(`/profissionais/por-procedimento/${procedimentoId}`),
  criar: (data) => api.post('/profissionais', data),
  atualizar: (id, data) => api.put(`/profissionais/${id}`, data),
  atualizarProcedimentos: (id, procedimentoIds) => api.put(`/profissionais/${id}/procedimentos`, { procedimentoIds }),
  deletar: (id) => api.delete(`/profissionais/${id}`),
};

export const agendamentosAPI = {
  listarPorDia: (data) => api.get(`/agendamentos${data ? `?data=${data}` : ''}`),
  todos: () => api.get('/agendamentos/todos'),
  criar: (data) => api.post('/agendamentos', data),
  atualizarStatus: (id, status) => api.patch(`/agendamentos/${id}/status`, { status }),
  deletar: (id) => api.delete(`/agendamentos/${id}`),
  dashboardStats: () => api.get('/agendamentos/dashboard-stats'),
};

export default api;