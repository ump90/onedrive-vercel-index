import axios from 'axios'

export class GraphRequestError extends Error {
  status: number
  data: unknown

  constructor({ status, data, message }: { status: number; data: unknown; message?: string }) {
    super(message ?? 'Microsoft Graph request failed.')
    this.name = 'GraphRequestError'
    this.status = status
    this.data = data
  }
}

export function toGraphRequestError(error: unknown, fallbackMessage = 'Internal server error.'): GraphRequestError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500
    const data = error.response?.data ?? fallbackMessage

    return new GraphRequestError({
      status,
      data,
      message: typeof data === 'string' ? data : error.message,
    })
  }

  if (error instanceof Error) {
    return new GraphRequestError({
      status: 500,
      data: fallbackMessage,
      message: error.message,
    })
  }

  return new GraphRequestError({
    status: 500,
    data: fallbackMessage,
    message: fallbackMessage,
  })
}
