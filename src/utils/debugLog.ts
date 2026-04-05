const DEBUG_PREFIX = '[ovi-debug]'

export function debugLog(label: string, payload?: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  const logger = console.info
  if (payload === undefined) {
    logger(DEBUG_PREFIX, label)
    return
  }

  logger(DEBUG_PREFIX, label, payload)
}

export function debugError(label: string, payload?: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  const logger = console.error
  if (payload === undefined) {
    logger(DEBUG_PREFIX, label)
    return
  }

  logger(DEBUG_PREFIX, label, payload)
}
