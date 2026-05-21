import { useState } from 'react'
import { useImprimer, type Orientation } from '../../hooks/useImprimer'

interface Props {
  url: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  avecOrientation?: boolean
  orientationDefaut?: Orientation
  className?: string
  variant?: 'primary' | 'secondary' | 'success' | 'outline-primary'
}

export function BoutonImprimer({
  url,
  label = 'Imprimer',
  size = 'sm',
  avecOrientation = false,
  orientationDefaut = 'portrait',
  className = '',
  variant = 'primary',
}: Props) {
  const { imprimer, enCours } = useImprimer()
  const [showModal, setShowModal] = useState(false)
  const [orientation, setOrientation] = useState<Orientation>(orientationDefaut)

  const handleImprimer = (o: Orientation) => {
    imprimer(url, o)
    setShowModal(false)
  }

  if (!avecOrientation) {
    return (
      <button
        type="button"
        className={`btn btn-${variant} btn-${size} ${className}`}
        onClick={() => imprimer(url, orientationDefaut)}
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

  return (
    <>
      <button
        type="button"
        className={`btn btn-${variant} btn-${size} ${className}`}
        onClick={() => setShowModal(true)}
        disabled={enCours}
      >
        {enCours ? (
          <><span className="spinner-border spinner-border-sm mr-1" />Préparation...</>
        ) : (
          <><i className="dw dw-printer mr-1" />{label}</>
        )}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '28px 32px',
              minWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h6 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                <i className="dw dw-printer mr-2" />Options d'impression
              </h6>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1 }}
              >×</button>
            </div>

            {/* Choix orientation */}
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>
              Orientation
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {(['portrait', 'paysage'] as Orientation[]).map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  style={{
                    flex: 1, border: `2px solid ${orientation === o ? '#7934f3' : '#e0e0e0'}`,
                    borderRadius: 10, padding: '14px 8px', background: orientation === o ? '#f5eeff' : '#fafafa',
                    cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  }}
                >
                  {/* Aperçu page */}
                  <div style={{
                    width: o === 'portrait' ? 36 : 52,
                    height: o === 'portrait' ? 52 : 36,
                    border: `2px solid ${orientation === o ? '#7934f3' : '#bbb'}`,
                    borderRadius: 3,
                    background: '#fff',
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {/* Lignes simulant du texte */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '60%' }}>
                      {[...Array(o === 'portrait' ? 4 : 3)].map((_, i) => (
                        <div key={i} style={{
                          height: 2, borderRadius: 2,
                          background: orientation === o ? '#c4a0f8' : '#ddd',
                          width: i === 0 ? '100%' : '75%',
                        }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: orientation === o ? 700 : 500, color: orientation === o ? '#7934f3' : '#444' }}>
                      {o === 'portrait' ? 'Portrait' : 'Paysage'}
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                      {o === 'portrait' ? '210 × 297 mm' : '297 × 210 mm'}
                    </div>
                  </div>
                  {orientation === o && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#7934f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleImprimer(orientation)}
                disabled={enCours}
                style={{ background: '#7934f3', borderColor: '#7934f3' }}
              >
                <i className="dw dw-printer mr-1" />
                Imprimer en {orientation}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}