import api from './axios'

// GET /api/etats-rapprochement/
export const getRapprochements = (params?: { skip?: number; limit?: number }) =>
  api.get('/api/etats-rapprochement/', { params }).then(r => r.data)

// GET /api/etats-rapprochement/compte/{compte_id}
export const getRapprochementsByCompte = (compteId: number) =>
  api.get(`/api/etats-rapprochement/compte/${compteId}`).then(r => r.data)

// GET /api/etats-rapprochement/{rapprochement_id}
export const getRapprochement = (id: number) =>
  api.get(`/api/etats-rapprochement/${id}`).then(r => r.data)

// POST /api/etats-rapprochement/
// Le backend calcule automatiquement solde_theorique et ecart
export const createRapprochement = (data: {
  id_compte: number
  intitule: string
  solde_balance: number
  operation_acct_non_constate: number
  operation_poste_non_constate: number
  observation?: string
  date_rapprochement?: string
}) => api.post('/api/etats-rapprochement/', data).then(r => r.data)

// DELETE /api/etats-rapprochement/{rapprochement_id}
export const deleteRapprochement = (id: number) =>
  api.delete(`/api/etats-rapprochement/${id}`)

// GET /api/etats-rapprochement/{rapprochement_id}/pdf?orientation=portrait|paysage
export const getRapprochementPdfUrl = (id: number, orientation = 'portrait') =>
  `/api/etats-rapprochement/${id}/pdf?orientation=${orientation}`
