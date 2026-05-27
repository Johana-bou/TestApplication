import { useState } from 'react'
import { useImprimer, type Orientation } from '../../hooks/useImprimer'
import toast from 'react-hot-toast'

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
  const { genererBlob, enCours } = useImprimer()
  const [showModal, setShowModal] = useState(false)
  const [orientation, setOrientation] = useState<Orientation>(orientationDefaut)
  const [pdfBlobBase64, setPdfBlobBase64] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)

  // Génère le PDF et stocke le base64 + URL blob pour l'aperçu
  const handleOuvrirViewer = async (o: Orientation) => {
    setLoadingPdf(true)
    const blob = await genererBlob(url, o)
    if (blob) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        setPdfBlobBase64(base64)
        setPdfUrl(URL.createObjectURL(blob))
      }
      reader.readAsDataURL(blob)
    } else {
      toast.error('Impossible de générer le PDF')
    }
    setLoadingPdf(false)
  }

  const handleFermer = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setPdfBlobBase64(null)
    setShowModal(false)
  }

  const handleTelecharger = () => {
    if (pdfBlobBase64 && (window as any).electronAPI) {
      (window as any).electronAPI.downloadPDF(pdfBlobBase64, 'document.pdf')
    } else if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = 'document.pdf'
      link.click()
    }
  }

  const handleImprimer = () => {
    if (pdfBlobBase64 && (window as any).electronAPI) {
      (window as any).electronAPI.printPDF(pdfBlobBase64, 'document.pdf')
    } else if (pdfUrl) {
      // fallback iframe (navigateur)
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none'
      iframe.src = pdfUrl
      document.body.appendChild(iframe)
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
          setTimeout(() => document.body.removeChild(iframe), 2000)
        }, 300)
      }
    }
  }

  // ── Bouton simple sans orientation ──────────────────────────
  if (!avecOrientation) {
    return (
      <button
        type="button"
        className={`btn btn-${variant} btn-${size} ${className}`}
        onClick={async () => {
          await handleOuvrirViewer(orientationDefaut)
          setShowModal(true)
        }}
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

      {/* Modal orientation */}
      {showModal && !pdfUrl && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, padding: '28px 32px',
              minWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h6 style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                <i className="dw dw-printer mr-2" />Options d'impression
              </h6>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#aaa' }}
              >×</button>
            </div>

            <p style={{ fontSize: 11, color: '#888', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1 }}>
              Orientation
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
              {(['portrait', 'paysage'] as Orientation[]).map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  style={{
                    flex: 1, border: `2px solid ${orientation === o ? '#7934f3' : '#e0e0e0'}`,
                    borderRadius: 12, padding: '16px 8px',
                    background: orientation === o ? '#f5eeff' : '#fafafa',
                    cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  }}
                >
                  {/* ... icône orientation ... */}
                  <div style={{
                    width: o === 'portrait' ? 36 : 52,
                    height: o === 'portrait' ? 52 : 36,
                    border: `2px solid ${orientation === o ? '#7934f3' : '#bbb'}`,
                    borderRadius: 3, background: '#fff',
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
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
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: orientation === o ? 700 : 500, color: orientation === o ? '#7934f3' : '#444' }}>
                      {o === 'portrait' ? 'Portrait' : 'Paysage'}
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                      {o === 'portrait' ? '210 × 297 mm' : '297 × 210 mm'}
                    </div>
                  </div>
                  {orientation === o && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#7934f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 11 }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-light btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => handleOuvrirViewer(orientation)}
                disabled={loadingPdf}
                style={{ background: '#7934f3', borderColor: '#7934f3', color: '#fff' }}
              >
                {loadingPdf ? <><span className="spinner-border spinner-border-sm mr-1" />Génération...</> : <><i className="dw dw-printer mr-1" />Aperçu & Imprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer PDF */}
      {pdfUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            background: '#1e1e2e', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', flexShrink: 0,
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="dw dw-printer" style={{ fontSize: 18, color: '#7934f3' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Aperçu du document</span>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>
                {orientation === 'portrait' ? '📄 Portrait' : '📄 Paysage'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleTelecharger} style={{ background: '#2d2d44', border: '1px solid #444', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="dw dw-download" />Télécharger
              </button>
              <button onClick={handleImprimer} style={{ background: '#7934f3', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="dw dw-printer" />Imprimer
              </button>
              <button onClick={handleFermer} style={{ background: '#e53e3e', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✕ Fermer
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', background: '#525659' }}>
            <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Aperçu PDF" />
          </div>
        </div>
      )}
    </>
  )
}