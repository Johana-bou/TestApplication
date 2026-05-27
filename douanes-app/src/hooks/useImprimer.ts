import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export type Orientation = 'portrait' | 'paysage'

export function useImprimer() {
  const { token } = useAuthStore()
  const [enCours, setEnCours] = useState(false)

  // ✅ Génère et retourne le blobUrl du PDF
  const genererPDF = async (url: string, orientation: Orientation = 'portrait'): Promise<string | null> => {
    setEnCours(true)
    const toastId = toast.loading('Génération du PDF...', { icon: '🖨️' })
    try {
      const response = await axios.get(`http://127.0.0.1:8000${url}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
        params: { orientation },
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      toast.dismiss(toastId)
      return blobUrl
    } catch (error: unknown) {
      toast.dismiss(toastId)
      const err = error as { response?: { status: number } }
      if (err.response?.status === 404) {
        toast.error('Document introuvable')
      } else if (err.response?.status === 500) {
        toast.error('Erreur génération PDF — vérifiez les données')
      } else {
        toast.error('Erreur lors de la génération du PDF')
      }
      return null
    } finally {
      setEnCours(false)
    }
  }

  // ✅ Imprimer directement (fallback)
  const imprimer = async (url: string, orientation: Orientation = 'portrait') => {
    const blobUrl = await genererPDF(url, orientation)
    if (!blobUrl) return
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = 'document.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    toast.success('PDF téléchargé')
  }

  return { imprimer, genererPDF, enCours }
}