interface Props {
  id: string
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm'|'lg'|'xl'
}
export function Modal({ id, title, children, footer, size }: Props) {
  return (
    <div className="modal fade" id={id} tabIndex={-1} role="dialog">
      <div className={`modal-dialog ${size ? `modal-${size}` : ''}`} role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="close" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
