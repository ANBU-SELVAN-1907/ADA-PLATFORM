import { useEffect } from 'react'
import { useStore } from '../store'

export function useKeyboardShortcuts() {
  const { toggleSettings, reset } = useStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K → focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('repo-url-input')
        input?.focus()
      }
      // Escape → close settings or reset
      if (e.key === 'Escape') {
        const { settingsOpen } = useStore.getState()
        if (settingsOpen) {
          toggleSettings()
        }
      }
      // Cmd/Ctrl + , → settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        toggleSettings()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSettings])
}