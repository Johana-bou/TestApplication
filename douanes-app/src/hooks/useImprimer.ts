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
    const toastId = toast.loading('Génération du PDF...', { icon: '🖨️' })

    try {
      // ✅ 127.0.0.1 au lieu de localhost
      const response = await axios.get(`http://127.0.0.1:8000${url}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)

      // ✅ Ouvre le PDF dans un nouvel onglet/fenêtre
      // Dans Electron, ceci ouvre le PDF dans le visualiseur par défaut du système
      const newWindow = window.open(blobUrl, '_blank')

      if (!newWindow) {
        // ✅ Fallback : téléchargement direct si la fenêtre est bloquée
        const link = document.createElement('a')
        link.href = blobUrl
        // Extrait le nom du fichier depuis l'URL (ex: /api/pv/1/pdf → PV_1.pdf)
        const parts = url.split('/')
        const id = parts[parts.findIndex(p => p === 'pdf') - 1] || 'document'
        const type = parts[1] || 'document'
        link.download = `${type}_${id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.dismiss(toastId)
        toast.success('PDF téléchargé avec succès')
      } else {
        toast.dismiss(toastId)
        toast.success('PDF ouvert — utilisez Ctrl+P pour imprimer')
      }

      // ✅ Nettoie le blob URL après 60 secondes
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)

    } catch (error: unknown) {
      toast.dismiss(toastId)
      const err = error as { response?: { status: number; data?: { detail?: string } } }
      if (err.response?.status === 404) {
        toast.error('Document introuvable')
      } else if (err.response?.status === 500) {
        toast.error('Erreur lors de la génération du PDF — vérifiez les données')
      } else {
        toast.error('Erreur lors de la génération du PDF')
      }
    } finally {
      setEnCours(false)
    }
  }

  return { imprimer, enCours }
}