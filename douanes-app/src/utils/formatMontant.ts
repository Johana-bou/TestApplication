export const formatMontant = (n: number): string =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'

export const formatMontantCourt = (n: number): string =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n))
