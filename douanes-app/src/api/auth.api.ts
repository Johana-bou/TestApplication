import api from './axios'

export interface Poste {
  id_poste: number
  code_poste: string
  nom_poste: string
  adresse?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id_user: number
    pseudo: string
    nom: string
    prenom: string
    role: 'ADMIN' | 'RECEVEUR'
  }
  poste: Poste
}

// GET /api/auth/postes  — pas de token requis
export const getPostes = (): Promise<Poste[]> =>
  api.get('/api/auth/postes').then(r => r.data)

// POST /api/auth/login
export const login = (data: {
  code_poste: string
  pseudo: string
  mot_de_passe: string
}): Promise<LoginResponse> =>
  api.post('/api/auth/login', data).then(r => r.data)

// POST /api/auth/postes/verify
export const verifyPoste = (code_poste: string) =>
  api.post('/api/auth/postes/verify', { code_poste }).then(r => r.data)
