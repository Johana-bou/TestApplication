import api from './axiosConfig';

export const pvApi = {
  createProcesVerbal: (data: any) => api.post('/pv/proces-verbal', data),
  getProcesVerbal: (id: string) => api.get(`/pv/proces-verbal/${id}`),
  getProcesVerbauxByPoste: (posteId: string) => api.get(`/pv/proces-verbaux/poste/${posteId}`),
  printProcesVerbal: (id: string) => api.get(`/pv/proces-verbal/${id}/pdf`, { responseType: 'blob' })
};
