import api from './axiosConfig';

export const posteApi = {
  getPostes: () => api.get('/auth/postes'),
  getPosteByCode: (code: string) => api.get(`/auth/postes/${code}`),
  verifyPoste: (code: string) => api.post('/auth/postes/verify', { code_poste: code })
};
