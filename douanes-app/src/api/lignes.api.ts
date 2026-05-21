import api from './axios'

export interface LigneBudgetaire {
  id?: number
  num_ligne: string
  intitule: string
  code_taxe: string
  // Pas de id_poste — les lignes sont globales
}

// GET /api/lignes-budgetaires/
export const getLignes = () =>
  api.get('/api/lignes-budgetaires/').then(r => r.data)

// GET /api/lignes-budgetaires/recherche/{num_ligne}
export const rechercherLigne = (num_ligne: string) =>
  api.get(`/api/lignes-budgetaires/recherche/${num_ligne}`).then(r => r.data)

// GET /api/lignes-budgetaires/verify/{num_ligne}
export const verifyLigne = (num_ligne: string) =>
  api.get(`/api/lignes-budgetaires/verify/${num_ligne}`).then(r => r.data)

// POST /api/lignes-budgetaires/
export const createLigne = (data: Omit<LigneBudgetaire, 'id'>) =>
  api.post('/api/lignes-budgetaires/', data).then(r => r.data)

// PUT /api/lignes-budgetaires/{id}
export const updateLigne = (id: number, data: Omit<LigneBudgetaire, 'id'>) =>
  api.put(`/api/lignes-budgetaires/${id}`, data).then(r => r.data)
// POST /api/lignes-budgetaires/bulk  ← attend { lignes: [...] }

export const bulkImportLignes = (lignes: Omit<LigneBudgetaire, 'id'>[]) =>
  api.post('/api/lignes-budgetaires/bulk', { lignes }).then(r => r.data)

// DELETE /api/lignes-budgetaires/{id}
export const deleteLigne = (id: number) =>
  api.delete(`/api/lignes-budgetaires/${id}`)

// Note: pas de PUT dans le router — la modification se fait par delete + create
