export function Spinner({ fullPage = false }: { fullPage?: boolean }) {
  if (fullPage) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only">Chargement...</span>
      </div>
    </div>
  )
  return <div className="spinner-border spinner-border-sm text-primary" role="status" />
}
