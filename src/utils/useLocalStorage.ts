import { Dispatch, SetStateAction, useCallback, useMemo, useSyncExternalStore } from 'react'

type SetValue<T> = Dispatch<SetStateAction<T>>

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const parseValue = useCallback(
    (item: string | null): T => {
      if (!item) {
        return initialValue
      }

      try {
        return JSON.parse(item) as T
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error)
        return initialValue
      }
    },
    [initialValue, key]
  )

  const getSnapshot = useCallback(() => {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error)
      return null
    }
  }, [key])

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => undefined
    }

    window.addEventListener('storage', onStoreChange)
    window.addEventListener('local-storage', onStoreChange)

    return () => {
      window.removeEventListener('storage', onStoreChange)
      window.removeEventListener('local-storage', onStoreChange)
    }
  }, [])

  const storedItem = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const storedValue = useMemo(() => parseValue(storedItem), [parseValue, storedItem])

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: SetValue<T> = value => {
    // Prevent build error "window is undefined" but keeps working
    if (typeof window == 'undefined') {
      console.warn(`Tried setting localStorage key “${key}” even though environment is not a client`)
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value

      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(newValue))

      // We dispatch a custom event so every useLocalStorage hook are notified
      window.dispatchEvent(new Event('local-storage'))
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error)
    }
  }

  return [storedValue, setValue]
}

export default useLocalStorage
