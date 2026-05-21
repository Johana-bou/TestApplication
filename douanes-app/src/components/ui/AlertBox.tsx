interface Props { message: string; type?: 'danger'|'info'|'warning'|'success' }
export function AlertBox({ message, type = 'danger' }: Props) {
  return (
    <div className={`alert alert-${type} alert-dismissible`} role="alert">
      {message}
    </div>
  )
}
