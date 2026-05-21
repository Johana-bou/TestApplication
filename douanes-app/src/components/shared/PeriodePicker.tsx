import type { PeriodeType } from '../../utils/periodes'

interface Props {
  value: PeriodeType
  onChange: (type: PeriodeType) => void
}

const PERIODES: { label: string; value: PeriodeType }[] = [
  { label: 'Mois courant', value: 'mois' },
  { label: 'Trimestre', value: 'trimestre' },
  { label: 'Semestre', value: 'semestre' },
  { label: 'Année', value: 'annee' },
]

export function PeriodePicker({ value, onChange }: Props) {
  return (
    <div className="btn-group" role="group">
      {PERIODES.map(p => (
        <button
          key={p.value}
          type="button"
          className={`btn btn-sm ${value === p.value ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
