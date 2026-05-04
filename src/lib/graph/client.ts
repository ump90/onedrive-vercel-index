import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

import { toGraphRequestError } from './errors'

export function authorizationHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` }
}

export async function graphGet<T>(
  url: string,
  accessToken: string,
  config: Omit<AxiosRequestConfig, 'headers'> & { headers?: Record<string, string> } = {},
): Promise<T> {
  try {
    const { headers = {}, ...restConfig } = config
    const response = await axios.get<T>(url, {
      ...restConfig,
      headers: {
        ...authorizationHeaders(accessToken),
        ...headers,
      },
    })

    return response.data
  } catch (error) {
    throw toGraphRequestError(error)
  }
}
