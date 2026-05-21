export const toDisplay = (d: string): string =>
  new Date(d + 'T00:00:00').toLocaleDateString('fr-FR')

export const toAPI = (d: Date): string =>
  d.toISOString().split('T')[0]

export const todayAPI = (): string => toAPI(new Date())
