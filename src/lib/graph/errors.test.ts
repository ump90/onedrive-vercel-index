import { describe, expect, it } from 'vitest'

import { GraphRequestError, toGraphRequestError } from './errors'

describe('Graph error conversion', () => {
  it('keeps Axios response status and payload', () => {
    const converted = toGraphRequestError({
      isAxiosError: true,
      message: 'Too many requests',
      response: {
        status: 429,
        data: { error: { code: 'tooManyRequests' } },
      },
    })

    expect(converted).toBeInstanceOf(GraphRequestError)
    expect(converted.status).toBe(429)
    expect(converted.data).toEqual({ error: { code: 'tooManyRequests' } })
  })

  it('normalises unknown failures to a 500 GraphRequestError', () => {
    const converted = toGraphRequestError(new Error('network down'))

    expect(converted.status).toBe(500)
    expect(converted.data).toBe('Internal server error.')
  })
})
