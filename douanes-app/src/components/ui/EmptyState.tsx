interface Props { message?: string; icon?: string }
export function EmptyState({ message = 'Aucune donnée disponible', icon = 'dw-inbox' }: Props) {
  return (
    <div className="text-center py-5">
      <i className={`dw ${icon} font-50 text-light`} />
      <p className="text-muted mt-3">{message}</p>
    </div>
  )
}
