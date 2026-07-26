// src/hooks/useEnterNavigation.ts
import { useEffect, RefObject } from 'react'

/**
 * Hook qui permet la navigation entre les champs de formulaire
 * avec la touche Entrée, jusqu'au bouton Enregistrer.
 * 
 * Usage : useEnterNavigation(formRef)
 * Il suffit d'ajouter ref={formRef} sur le <form>
 */
export function useEnterNavigation(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const form = formRef.current
    if (!form) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return

      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()

      // ✅ Ne pas intercepter sur textarea (Entrée = nouvelle ligne)
      if (tag === 'textarea') return

      // ✅ Ne pas intercepter sur les boutons (laisser le comportement normal)
      if (tag === 'button') return

      // ✅ Ne pas intercepter sur select (Entrée = sélectionner)
      if (tag === 'select') return

      e.preventDefault()

      // ✅ Récupère tous les champs focusables du formulaire
      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([readonly]):not([type="hidden"]), ' +
          'select:not([disabled]), ' +
          'textarea:not([disabled]), ' +
          'button:not([disabled])'
        )
      ).filter(el => {
        // Exclut les éléments invisibles
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })

      const currentIndex = focusable.indexOf(target)
      if (currentIndex === -1) return

      const next = focusable[currentIndex + 1]

      if (next) {
        // ✅ Si c'est le bouton Enregistrer — on le focus et on le met en évidence
        if (next.tagName.toLowerCase() === 'button' && next.type === 'submit') {
          next.focus()
          next.style.boxShadow = '0 0 0 3px rgba(121, 52, 243, 0.4)'
          setTimeout(() => { next.style.boxShadow = '' }, 1500)
        } else {
          next.focus()
          // ✅ Sélectionne le contenu si c'est un input texte/nombre
          if (next instanceof HTMLInputElement &&
              ['text', 'number', 'email', 'tel'].includes(next.type)) {
            next.select()
          }
        }
      }
    }

    form.addEventListener('keydown', handleKeyDown)
    return () => form.removeEventListener('keydown', handleKeyDown)
  }, [formRef])
}
