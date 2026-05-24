import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'qa.ftue.completed'
const EVENT_NAME = 'qa-ftue-changed'

function readFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeFlag(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    /* localStorage may be unavailable — ignore */
  }
}

export interface FTUEState {
  completed: boolean
  markCompleted: () => void
  reset: () => void
}

export function useFTUE(): FTUEState {
  const [completed, setCompleted] = useState<boolean>(() => readFlag())

  // Keep state in sync if the flag changes elsewhere (e.g. Settings menu reset).
  useEffect(() => {
    const sync = (): void => setCompleted(readFlag())
    window.addEventListener(EVENT_NAME, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const markCompleted = useCallback(() => {
    writeFlag(true)
    setCompleted(true)
  }, [])

  const reset = useCallback(() => {
    writeFlag(false)
    setCompleted(false)
  }, [])

  return { completed, markCompleted, reset }
}
