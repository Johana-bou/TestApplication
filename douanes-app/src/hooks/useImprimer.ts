import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export type Orientation = 'portrait' | 'paysage'

export function useImprimer() {
  const { token } = useAuthStore()
  const [enCours, setEnCours] = useState(false)

  const imprimer = async (url: string, orientation: Orientation = 'portrait') => {
    setEnCours(true)
    const toastId = toast.loading('impression en cours...', { icon: '🖨️' })
    try {
      const response = await axios.get(`http://localhost:8000${url}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-1000px'
      iframe.style.left = '-1000px'
      iframe.style.width = '1px'
      iframe.style.height = '1px'
      iframe.style.border = 'none'
      iframe.src = blobUrl
      document.body.appendChild(iframe)

      iframe.onload = () => {
        setTimeout(() => {
          try {
            // Injection de l'orientation via @page CSS dans l'iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (iframeDoc) {
              const style = iframeDoc.createElement('style')
              style.textContent = `@page { size: A4 ${orientation === 'paysage' ? 'landscape' : 'portrait'}; }`
              iframeDoc.head?.appendChild(style)
            }

            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
          } catch (err) {
            console.error('Erreur impression:', err)
            toast.error("Impossible d'ouvrir la boîte d'impression")
          }
        }, 500)
      }

      const handleAfterPrint = () => {
        setTimeout(() => {
          if (iframe?.parentNode) {
            document.body.removeChild(iframe)
          }
          URL.revokeObjectURL(blobUrl)
          window.removeEventListener('afterprint', handleAfterPrint)
        }, 1000)
      }
      window.addEventListener('afterprint', handleAfterPrint)

      toast.dismiss(toastId)
      toast.success('Document prêt à imprimer')
    } catch (error: unknown) {
      toast.dismiss(toastId)
      const err = error as { response?: { status: number; data?: { detail?: string } } }
      if (err.response?.status === 404) {
        toast.error('Document introuvable')
      } else {
        toast.error('Erreur lors de la génération du PDF')
      }
    } finally {
      setEnCours(false)
    }
  }

  return { imprimer, enCours }
}