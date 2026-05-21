import api from './axios'

export interface ConfigImpression {
  id_config?: number
  id_poste: number
  logo_path?: string
  entete?: string
  pied_page?: string
  nom_receveur?: string
  grade_receveur?: string
}

// GET /api/config-impression/poste/{poste_id}
export const getConfigImpression = (posteId: number): Promise<ConfigImpression> =>
  api.get(`/api/config-impression/poste/${posteId}`).then(r => r.data)

// POST /api/config-impression/  — crée ou met à jour (upsert)
export const saveConfigImpression = (data: ConfigImpression) =>
  api.post('/api/config-impression/', data).then(r => r.data)
