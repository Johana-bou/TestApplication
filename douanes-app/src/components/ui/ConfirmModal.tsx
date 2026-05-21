interface Props {
  id: string
  message: string
  onConfirm: () => void
  loading?: boolean
}
export function ConfirmModal({ id, message, onConfirm, loading }: Props) {
  return (
    <div className="modal fade" id={id} tabIndex={-1} role="dialog">
      <div className="modal-dialog modal-sm" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirmation</h5>
            <button type="button" className="close" data-dismiss="modal"><span>&times;</span></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" data-dismiss="modal">Annuler</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
