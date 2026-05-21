import api from './axios'

// ============================================================
// UTILISATEURS  — /api/utilisateurs
// ============================================================
export const getUtilisateurs = () =>
  api.get('/api/utilisateurs/').then(r => r.data)

export const getUtilisateursByPoste = (posteId: number) =>
  api.get(`/api/utilisateurs/poste/${posteId}`).then(r => r.data)

// GET /api/utilisateurs/moi  — profil de l'utilisateur connecté
export const getMonProfil = () =>
  api.get('/api/utilisateurs/moi').then(r => r.data)

export const getUtilisateur = (id: number) =>
  api.get(`/api/utilisateurs/${id}`).then(r => r.data)

// POST /api/utilisateurs/
// Champs requis: nom, prenom, pseudo, mot_de_passe, role, poste_id
// L'affectation est créée automatiquement
export const createUtilisateur = (data: {
  nom: string
  prenom: string
  pseudo: string
  mot_de_passe: string
  role: 'ADMIN' | 'RECEVEUR'
  poste_id: number
  email?: string
}) => api.post('/api/utilisateurs/', data).then(r => r.data)

// PUT /api/utilisateurs/{user_id}
export const updateUtilisateur = (id: number, data: {
  nom?: string
  prenom?: string
  email?: string
  mot_de_passe?: string
  role?: string
  actif?: boolean
}) => api.put(`/api/utilisateurs/${id}`, data).then(r => r.data)

export const deleteUtilisateur = (id: number) =>
  api.delete(`/api/utilisateurs/${id}`)

// ============================================================
// AFFECTATIONS  — /api/affectations
// ============================================================
export const getAffectations = () =>
  api.get('/api/affectations/').then(r => r.data)

export const getAffectationsByUser = (userId: number) =>
  api.get(`/api/affectations/utilisateur/${userId}`).then(r => r.data)

export const getAffectationsByPoste = (posteId: number) =>
  api.get(`/api/affectations/poste/${posteId}`).then(r => r.data)

export const getAffectationsActives = () =>
  api.get('/api/affectations/actives').then(r => r.data)

// POST /api/affectations/
// Champs: id_user, id_poste, date_debut
// Termine automatiquement les affectations actives précédentes
export const createAffectation = (data: {
  id_user: number   // ← id_user (pas id_utilisateur)
  id_poste: number
  date_debut: string
}) => api.post('/api/affectations/', data).then(r => r.data)

// PUT /api/affectations/{id}  — pour modifier date_fin uniquement
export const updateAffectation = (id: number, data: { date_fin?: string | null }) =>
  api.put(`/api/affectations/${id}`, data).then(r => r.data)

export const deleteAffectation = (id: number) =>
  api.delete(`/api/affectations/${id}`)

// ============================================================
// AUDIT LOGS  — /api/audit
// ============================================================
export const getAuditLogs = (params?: { skip?: number; limit?: number; table?: string }) =>
  api.get('/api/audit/', { params }).then(r => r.data)

export const getAuditLogsByUser = (userId: number) =>
  api.get(`/api/audit/utilisateur/${userId}`).then(r => r.data)

// ============================================================
// COMPTES  — /api/comptes
// ============================================================
export const getComptes = () =>
  api.get('/api/comptes/').then(r => r.data)

export const getComptesByPoste = (posteId: number) =>
  api.get(`/api/comptes/poste/${posteId}`).then(r => r.data)

export const getComptesGeneraux = () =>
  api.get('/api/comptes/generaux').then(r => r.data)

export const getCompte = (id: number) =>
  api.get(`/api/comptes/${id}`).then(r => r.data)

export const createCompte = (data: {
  num_compte: string
  nom_compte: string
  id_poste?: number
}) => api.post('/api/comptes/', data).then(r => r.data)

export const updateCompte = (id: number, data: { nom_compte?: string }) =>
  api.put(`/api/comptes/${id}`, data).then(r => r.data)

export const deleteCompte = (id: number) =>
  api.delete(`/api/comptes/${id}`)

// ============================================================
// USAGERS  — /api/usagers
// ============================================================
export const getUsagers = () =>
  api.get('/api/usagers/').then(r => r.data)

export const getUsagersByCompte = (compteId: number) =>
  api.get(`/api/usagers/compte/${compteId}`).then(r => r.data)

export const getUsager = (id: number) =>
  api.get(`/api/usagers/${id}`).then(r => r.data)

export const createUsager = (data: {
  nom_usager: string
  id_compte: number
  raison_sociale?: string
  telephone?: string
}) => api.post('/api/usagers/', data).then(r => r.data)

export const updateUsager = (id: number, data: {
  nom_usager?: string
  raison_sociale?: string
  telephone?: string
}) => api.put(`/api/usagers/${id}`, data).then(r => r.data)

export const deleteUsager = (id: number) =>
  api.delete(`/api/usagers/${id}`)

// ============================================================
// POSTES  — /api/postes (lecture pour admin)
// ============================================================
export const getPostes = () =>
  api.get('/api/postes/').then(r => r.data)

export const createPoste = (data: {
  code_poste: string
  nom_poste: string
  adresse?: string
}) => api.post('/api/postes/', data).then(r => r.data)

export const updatePoste = (id: number, data: { nom_poste?: string; adresse?: string }) =>
  api.put(`/api/postes/${id}`, data).then(r => r.data)

export const deletePoste = (id: number) =>
  api.delete(`/api/postes/${id}`)
