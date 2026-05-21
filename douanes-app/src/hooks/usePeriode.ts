import { useState } from 'react'
import { getPeriode, type PeriodeType } from '../utils/periodes'

export function usePeriode() {
  const [type, setType] = useState<PeriodeType>('mois')
  const periode = getPeriode(type)
  return { type, setType, ...periode }
}
