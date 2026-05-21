import api from './axios'

// GET /api/etats-nominatifs/types/disponibles
export const getTypesDisponibles = () =>
  api.get('/api/etats-nominatifs/types/disponibles').then(r => r.data)

// GET /api/etats-nominatifs/compte-amende/{poste_id}
export const getCompteAmende = (posteId: number) =>
  api.get(`/api/etats-nominatifs/compte-amende/${posteId}`).then(r => r.data)

// GET /api/etats-nominatifs/usagers/disponibles?search=...&etat_id=...
export const getUsagersDisponibles = (params?: {
  search?: string
  etat_id?: number
}) => api.get('/api/etats-nominatifs/usagers/disponibles', { params }).then(r => r.data)

// GET /api/etats-nominatifs/usagers/{usager_id}
export const getUsagerDetail = (usagerId: number) =>
  api.get(`/api/etats-nominatifs/usagers/${usagerId}`).then(r => r.data)

// GET /api/etats-nominatifs/?skip=0&limit=100&date_debut=...&date_fin=...
export const getEtatsNominatifs = (params?: {
  skip?: number
  limit?: number
  date_debut?: string
  date_fin?: string
}) => api.get('/api/etats-nominatifs/', { params }).then(r => r.data)

// GET /api/etats-nominatifs/{etat_id}
export const getEtatNominatif = (id: number) =>
  api.get(`/api/etats-nominatifs/${id}`).then(r => r.data)

// POST /api/etats-nominatifs/
// Payload: { type: 'RAR'|'AMENDE', date_etat?, observation?, id_compte?, lignes: [{id_usager, libelle, montant_rar_physique, montant_rar_balance}] }
export const createEtatNominatif = (data: {
  type: 'RAR' | 'AMENDE'
  date_etat?: string
  observation?: string
  id_compte?: number
  lignes: {
    id_usager: number
    libelle: string
    montant_rar_physique: number
    montant_rar_balance: number
  }[]
}) => api.post('/api/etats-nominatifs/', data).then(r => r.data)

// PUT /api/etats-nominatifs/{etat_id}
export const updateEtatNominatif = (id: number, data: {
  date_etat?: string
  observation?: string
}) => api.put(`/api/etats-nominatifs/${id}`, data).then(r => r.data)

// DELETE /api/etats-nominatifs/{etat_id}
export const deleteEtatNominatif = (id: number) =>
  api.delete(`/api/etats-nominatifs/${id}`)

// POST /api/etats-nominatifs/{etat_id}/lignes
export const addLigneNominatif = (etatId: number, data: {
  id_usager: number
  libelle: string
  montant_rar_physique: number
  montant_rar_balance: number
}) => api.post(`/api/etats-nominatifs/${etatId}/lignes`, data).then(r => r.data)

// DELETE /api/etats-nominatifs/lignes/{ligne_id}
export const deleteLigneNominatif = (ligneId: number) =>
  api.delete(`/api/etats-nominatifs/lignes/${ligneId}`)

// GET /api/etats-nominatifs/{etat_id}/pdf?orientation=portrait|paysage
export const getEtatNominatifPdfUrl = (id: number, orientation = 'portrait') =>
  `/api/etats-nominatifs/${id}/pdf?orientation=${orientation}`

// GET /api/etats-nominatifs/telecharger/pdf?type=RAR&mois=4&annee=2026&orientation=...
export const telechargerPdfParTypeMois = (params: {
  type: 'RAR' | 'AMENDE'
  mois: number
  annee: number
  orientation?: string
}) => api.get('/api/etats-nominatifs/telecharger/pdf', { params, responseType: 'blob' }).then(r => r.data)
