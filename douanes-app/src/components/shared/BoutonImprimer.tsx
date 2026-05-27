import { useImprimer, type Orientation } from '../../hooks/useImprimer'

interface Props {
  url: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  orientation?: Orientation      // portrait (défaut) ou paysage
  avecOrientation?: boolean      // [DEPRECATED] ignoré, gardé pour compatibilité
  className?: string
  variant?: 'primary' | 'secondary' | 'success' | 'outline-primary'
}

export function BoutonImprimer({
  url,
  label = 'Imprimer',
  size = 'sm',
  orientation = 'portrait',
  avecOrientation, // non utilisé, juste pour éviter l'erreur TS
  className = '',
  variant = 'primary',
}: Props) {
  const { imprimer, enCours } = useImprimer()

  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={() => imprimer(url, orientation)}
      disabled={enCours}
    >
      {enCours ? (
        <><span className="spinner-border spinner-border-sm mr-1" />Préparation...</>
      ) : (
        <><i className="dw dw-printer mr-1" />{label}</>
      )}
    </button>
  )
}