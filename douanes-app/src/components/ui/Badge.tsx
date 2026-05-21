interface Props { label: string; type?: 'primary'|'success'|'danger'|'warning'|'info'|'secondary' }
export function Badge({ label, type = 'primary' }: Props) {
  return <span className={`badge badge-${type}`}>{label}</span>
}
