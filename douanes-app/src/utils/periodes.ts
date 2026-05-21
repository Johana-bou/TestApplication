// ✅ Pas de toISOString() — formatage manuel pour éviter le décalage UTC
export function dernierJourDuMois(annee: number, mois: number): string {
  const d = new Date(annee, mois, 0)  // dernier jour du mois
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export type PeriodeType = 'mois' | 'trimestre' | 'semestre' | 'annee'

export function getPeriode(type: PeriodeType) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1

  switch (type) {
    case 'mois':
      return {
        date_debut: `${y}-${String(m).padStart(2, '0')}-01`,
        date_fin:   dernierJourDuMois(y, m),
      }
    case 'trimestre': {
      const trimDeb = Math.floor((m - 1) / 3) * 3 + 1
      const trimFin = trimDeb + 2
      return {
        date_debut: `${y}-${String(trimDeb).padStart(2, '0')}-01`,
        date_fin:   dernierJourDuMois(y, trimFin),
      }
    }
    case 'semestre': {
      const semDeb = m <= 6 ? 1 : 7
      const semFin = m <= 6 ? 6 : 12
      return {
        date_debut: `${y}-${String(semDeb).padStart(2, '0')}-01`,
        date_fin:   dernierJourDuMois(y, semFin),
      }
    }
    case 'annee':
      return {
        date_debut: `${y}-01-01`,
        date_fin:   `${y}-12-31`,
      }
  }
}