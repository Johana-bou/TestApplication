import { formatMontant } from '../../utils/formatMontant'
export function MontantFCFA({ value }: { value: number }) {
  return <span>{formatMontant(value)}</span>
}
