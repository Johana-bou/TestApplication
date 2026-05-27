import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export type Orientation = 'portrait' | 'paysage'

// Détection Electron
const isElectron = () => !!(window as any).electronAPI

export function useImprimer() {
  const { token } = useAuthStore()
  const [enCours, setEnCours] = useState(false)

  // Génère le blob PDF
  const genererBlob = async (url: string, orientation: Orientation = 'portrait'): Promise<Blob | null> => {
    setEnCours(true)
    const toastId = toast.loading('Génération du PDF...', { icon: '🖨️' })
    try {
      const response = await axios.get(`http://127.0.0.1:8000${url}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
        params: { orientation },
      })
      toast.dismiss(toastId)
      return response.data
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

  // Impression via Electron
  const imprimerElectron = async (url: string, orientation: Orientation = 'portrait') => {
    const blob = await genererBlob(url, orientation)
    if (!blob) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      ;(window as any).electronAPI.printPDF(base64, 'document.pdf')
    }
    reader.readAsDataURL(blob)
  }

  // Fallback : téléchargement simple (navigateur)
  const imprimerFallback = async (url: string, orientation: Orientation = 'portrait') => {
    const blob = await genererBlob(url, orientation)
    if (!blob) return
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = 'document.pdf'
    link.click()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    toast.success('PDF téléchargé')
  }

  const imprimer = isElectron() ? imprimerElectron : imprimerFallback

  return { imprimer, genererBlob, enCours }
}