import { useSyncExternalStore } from 'react'

function getDeviceOS(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const userAgent = window.navigator.userAgent

  if (userAgent.indexOf('Windows') > -1) {
    return 'windows'
  }

  if (userAgent.indexOf('Mac OS') > -1) {
    return 'mac'
  }

  if (userAgent.indexOf('Linux') > -1) {
    return 'linux'
  }

  return 'other'
}

function subscribeOS() {
  return () => undefined
}

export default function useDeviceOS(): string {
  return useSyncExternalStore(subscribeOS, getDeviceOS, () => '')
}
