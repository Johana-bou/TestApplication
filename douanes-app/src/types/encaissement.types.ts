export interface LigneBudgetaire {
  id_ligne?: number
  num_ligne: string
  intitule: string
  code_taxe: string
  id_poste: number
}

export interface EtatEncaissement {
  id_encaissement?: number
  num_ligne: string
  intitule?: string
  code_taxe?: string
  montant: number
  date_encaissement: string
  id_unite: number
  nom_unite?: string
}
