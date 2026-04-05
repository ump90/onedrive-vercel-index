export function segmentsToPath(pathSegments?: string[]) {
  if (!pathSegments?.length) {
    return '/'
  }

  return `/${pathSegments.map(segment => encodeURIComponent(segment)).join('/')}`
}
