import api from './axiosConfig';

export const authApi = {
  getPostes: () => api.get('/auth/postes'),
  verifyPoste: (codePoste: string) => api.post('/auth/postes/verify', { code_poste: codePoste }),
  login: (credentials: any) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout')
};
