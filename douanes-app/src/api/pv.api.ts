import api from './axios'

// GET /api/pv/  — ADMIN voit tout, RECEVEUR voit son poste
export const getPVList = (params?: Record<string, unknown>) =>
  api.get('/api/pv/', { params }).then(r => r.data)

// GET /api/pv/poste/{poste_id}
export const getPVByPoste = (posteId: number, params?: Record<string, unknown>) =>
  api.get(`/api/pv/poste/${posteId}`, { params }).then(r => r.data)

// GET /api/pv/{pv_id}
export const getPV = (id: number) =>
  api.get(`/api/pv/${id}`).then(r => r.data)

// POST /api/pv/
// Champs obligatoires: date_pv, poste_id
// Champs optionnels: solde_dernier_controle, mouvements_debiteurs,
//   mouvements_crediteurs, observation, virements[], cheques[]
// (num_pv est généré automatiquement par le backend)
export const createPV = (data: Record<string, unknown>) =>
  api.post('/api/pv/', data).then(r => r.data)

// PUT /api/pv/{pv_id}  — seule observation modifiable
export const updatePV = (id: number, data: { observation?: string }) =>
  api.put(`/api/pv/${id}`, data).then(r => r.data)

// DELETE /api/pv/{pv_id}
export const deletePV = (id: number) =>
  api.delete(`/api/pv/${id}`)

// POST /api/pv/{pv_id}/virements
export const addVirement = (pvId: number, data: {
  date_virement: string
  num_virement: string
  montant: number
  observation?: string
}) => api.post(`/api/pv/${pvId}/virements`, data).then(r => r.data)

// POST /api/pv/{pv_id}/virements/bulk
export const addVirementsBulk = (pvId: number, virements: {
  date_virement: string
  num_virement: string
  montant: number
  observation?: string
}[]) => api.post(`/api/pv/${pvId}/virements/bulk`, { virements }).then(r => r.data)

// GET /api/pv/{pv_id}/pdf
export const getPVPdf = (id: number) => `/api/pv/${id}/pdf`