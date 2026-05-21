export interface Virement {
  id?: number
  date_virement: string
  numero_virement: string
  montant: number
  observation?: string
}

export interface Cheque {
  id?: number
  date_cheque: string
  numero_cheque: string
  montant: number
  numero_dr?: string
  observation?: string
}

export interface PV {
  id_pv?: number
  numero_pv?: string
  date_pv: string
  id_poste: number
  nom_poste?: string
  periode_debut?: string
  periode_fin?: string
  solde_dernier_controle: number
  mouvements_debiteurs: number
  mouvements_crediteurs: number
  solde_theorique?: number
  observation?: string
  virements?: Virement[]
  cheques?: Cheque[]
}
