// src/components/layout/PreLoader.tsx
import { useEffect, useState } from 'react'

const DURATION = 1800

export function PreLoader() {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 10
      })
    }, 150)

    const timer = setTimeout(() => {
      setVisible(false)
      // ✅ Signaler que l'app est prête — le Layout peut maintenant init le sidebar
      window.dispatchEvent(new Event('app:ready'))
    }, DURATION)

    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [])

  if (!visible) return null

  return (
    <div className="pre-loader">
      <div className="pre-loader-box">
        <div className="loader-logo">
          <img src="/vendors/images/logo-tresor.png" alt="" style={{ width: 70, height: 70, objectFit: 'contain' }} />
        </div>
        <div className="loader-progress" style={{ background: '#eee', borderRadius: 4, height: 6, width: '100%', marginTop: 12 }}>
          <div className="bar" style={{ background: '#147c3fff', height: '100%', borderRadius: 4, width: `${progress}%`, transition: 'width 0.15s' }} />
        </div>
        <div className="percent" style={{ marginTop: 8, color: '#1b9439ff', fontWeight: 600 }}>{progress}%</div>
        <div className="loading-text" style={{ color: '#888', fontSize: 13 }}>Chargement...</div>
      </div>
    </div>
  )
}