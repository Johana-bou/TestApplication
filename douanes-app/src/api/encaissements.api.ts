import api from './axios'

export interface CreateEncaissementPayload {
  id_unite: number
  num_ligne: string      // ← le backend résout code_taxe/intitulé automatiquement
  date_encaissement: string  // ISO YYYY-MM-DD
  montant: number
}

// POST /api/etats-encaissement/
export const createEncaissement = (data: CreateEncaissementPayload) =>
  api.post('/api/etats-encaissement/', data).then(r => r.data)

// GET /api/etats-encaissement/unite/{unite_id}
export const getEncaissementsByUnite = (
  uniteId: number,
  params?: { skip?: number; limit?: number }
) => api.get(`/api/etats-encaissement/unite/${uniteId}`, { params }).then(r => r.data)
