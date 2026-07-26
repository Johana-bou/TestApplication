import { useEffect, RefObject } from 'react'

export function useEnterNavigation(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const form = formRef.current
    if (!form) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()
      if (tag === 'textarea' || tag === 'button' || tag === 'select') return
      e.preventDefault()

      const focusable = Array.from(
        form.querySelectorAll<HTMLElement>(
          'input:not([disabled]):not([readonly]):not([type="hidden"]), ' +
          'select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        )
      ).filter(el => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })

      const currentIndex = focusable.indexOf(target)
      if (currentIndex === -1) return
      const next = focusable[currentIndex + 1]
      if (next) {
        next.focus()
        if (next.tagName.toLowerCase() === 'button' && (next as HTMLButtonElement).type === 'submit') {
          next.style.boxShadow = '0 0 0 3px rgba(121, 52, 243, 0.4)'
          setTimeout(() => { next.style.boxShadow = '' }, 1500)
        }
        if (next instanceof HTMLInputElement && ['text', 'number', 'email', 'tel'].includes(next.type)) {
          next.select()
        }
      }
    }

    form.addEventListener('keydown', handleKeyDown)
    return () => form.removeEventListener('keydown', handleKeyDown)
  }, [formRef])
}
