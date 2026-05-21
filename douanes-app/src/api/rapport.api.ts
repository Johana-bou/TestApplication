import api from './axios'

export interface RapportLigne {
  id_unite: number
  nom_unite: string
  montants_par_mois: Record<number, number>
  total: number
}

export interface RapportParams {
  type_rapport: 'PROTOCOLE' | 'CAC'
  date_debut: string  // YYYY-MM-DD
  date_fin: string    // YYYY-MM-DD
}

// ← /rapports/tableau  (PAS /api/rapports/tableau)
export const getRapportTableau = (params: RapportParams): Promise<RapportLigne[]> =>
  api.get('/rapports/tableau', { params }).then(r => r.data)

// ← /rapports/pdf (PAS /api/rapports/pdf)
export const getRapportPdfUrl = (params: RapportParams): string => {
  const q = new URLSearchParams({
    type_rapport: params.type_rapport,
    date_debut:   params.date_debut,
    date_fin:     params.date_fin,
  })
  return `/rapports/pdf?${q.toString()}`
}