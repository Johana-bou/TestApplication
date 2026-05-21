import api from './axios'

export interface Unite {
  id_unite: number
  nom_unite: string
  id_poste: number
  created_at?: string
}

// GET /api/unites/
export const getUnites = (): Promise<Unite[]> =>
  api.get('/api/unites/').then(r => r.data)

// GET /api/unites/poste/{poste_id}
export const getUnitesByPoste = (posteId: number): Promise<Unite[]> =>
  api.get(`/api/unites/poste/${posteId}`).then(r => r.data)

// GET /api/unites/{unite_id}
export const getUnite = (id: number): Promise<Unite> =>
  api.get(`/api/unites/${id}`).then(r => r.data)

// POST /api/unites/  — ADMIN ou RECEVEUR
export const createUnite = (data: { nom_unite: string; id_poste: number }) =>
  api.post('/api/unites/', data).then(r => r.data)

// PUT /api/unites/{unite_id}  — ADMIN ou RECEVEUR
export const updateUnite = (id: number, data: { nom_unite?: string }) =>
  api.put(`/api/unites/${id}`, data).then(r => r.data)

// DELETE /api/unites/{unite_id}  — ADMIN uniquement
export const deleteUnite = (id: number) =>
  api.delete(`/api/unites/${id}`)
