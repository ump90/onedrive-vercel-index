import CryptoJS from 'crypto-js'

const AES_SECRET_KEY = 'onedrive-vercel-index'

type PersonInfo = {
  userPrincipalName?: string
}

export function obfuscateToken(token: string): string {
  return CryptoJS.AES.encrypt(token, AES_SECRET_KEY).toString()
}

export async function getAuthPersonInfo({
  accessToken,
  profileApi,
}: {
  accessToken: string
  profileApi: string
}): Promise<{ data: PersonInfo; status: number }> {
  const response = await fetch(profileApi, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = (await response.json().catch(() => ({}))) as PersonInfo

  return { data, status: response.status }
}

export async function sendTokenToServer({
  accessToken,
  expiryTime,
  refreshToken,
}: {
  accessToken: string
  expiryTime: number
  refreshToken: string
}): Promise<void> {
  const response = await fetch('/api/drive', {
    body: JSON.stringify({
      accessTokenExpiry: expiryTime,
      obfuscatedAccessToken: obfuscateToken(accessToken),
      obfuscatedRefreshToken: obfuscateToken(refreshToken),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(response.statusText || 'Error storing the token')
  }
}
