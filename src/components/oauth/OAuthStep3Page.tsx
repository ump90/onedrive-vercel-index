'use client'

import type { ReactNode } from 'react'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRouter } from 'next/navigation'

import siteConfig from '../../../config/site.config'
import OAuthPageFrame from './OAuthPageFrame'
import { getAuthPersonInfo, sendTokenToServer } from '../../utils/oAuthHandler'
import { LoadingIcon } from '../Loading'
import { Trans, useTranslation } from '../../i18n'

type OAuthStep3PageProps = {
  accessToken?: string
  expiryTime?: number
  refreshToken?: string
  error: string | null
  description?: string
  errorUri?: string
}

export default function OAuthStep3Page({
  accessToken = '',
  expiryTime = 0,
  refreshToken = '',
  error,
  description,
  errorUri,
}: OAuthStep3PageProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [expiryTimeLeft, setExpiryTimeLeft] = useState(expiryTime)
  const shouldCountdown = expiryTimeLeft > 0
  const [buttonContent, setButtonContent] = useState<ReactNode>(
    <div>
      <span>{t('Store tokens')}</span> <FontAwesomeIcon icon="key" />
    </div>,
  )
  const [buttonError, setButtonError] = useState(false)

  useEffect(() => {
    if (!shouldCountdown) {
      return
    }

    const intervalId = setInterval(() => {
      setExpiryTimeLeft(current => Math.max(current - 1, 0))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [shouldCountdown])

  const sendAuthTokensToServer = async () => {
    setButtonError(false)
    setButtonContent(
      <div>
        <span>{t('Storing tokens')}</span> <LoadingIcon className="ml-1 inline h-4 w-4 animate-spin" />
      </div>,
    )

    const { data, status } = await getAuthPersonInfo(accessToken)
    if (status !== 200) {
      setButtonError(true)
      setButtonContent(
        <div>
          <span>{t('Error validating identify, restart')}</span> <FontAwesomeIcon icon="exclamation-circle" />
        </div>,
      )
      return
    }

    if (data.userPrincipalName !== siteConfig.userPrincipalName) {
      setButtonError(true)
      setButtonContent(
        <div>
          <span>{t('Do not pretend to be the site owner')}</span> <FontAwesomeIcon icon="exclamation-circle" />
        </div>,
      )
      return
    }

    await sendTokenToServer(accessToken, refreshToken, String(expiryTime))
      .then(() => {
        setButtonError(false)
        setButtonContent(
          <div>
            <span>{t('Stored! Going home...')}</span> <FontAwesomeIcon icon="check" />
          </div>,
        )
        setTimeout(() => {
          router.push('/')
        }, 2000)
      })
      .catch(() => {
        setButtonError(true)
        setButtonContent(
          <div>
            <span>{t('Error storing the token')}</span> <FontAwesomeIcon icon="exclamation-circle" />
          </div>,
        )
      })
  }

  return (
    <OAuthPageFrame
      illustrationSrc="/images/fabulous-celebration.png"
      illustrationAlt="fabulous celebration"
      stepTitle={t('Step 3/3: Get access and refresh tokens')}
    >
      {error ? (
        <div>
          <p className="py-1 font-medium text-red-500">
            <FontAwesomeIcon icon="exclamation-circle" className="mr-2" />
            <span>{t('Whoops, looks like we got a problem: {{error}}.', { error: t(error) })}</span>
          </p>
          <p className="my-2 whitespace-pre-line rounded border border-gray-400/20 bg-gray-50 p-2 font-mono text-sm opacity-80 dark:bg-gray-800">
            {description ? t(description) : ''}
          </p>
          {errorUri && (
            <p>
              <Trans>
                Check out{' '}
                <a
                  href={errorUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-500"
                >
                  Microsoft&apos;s official explanation
                </a>{' '}
                on the error message.
              </Trans>
            </p>
          )}
          <div className="mb-2 mt-6 text-right">
            <button
              className="rounded-lg bg-gradient-to-br from-red-500 to-orange-400 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:grayscale dark:focus:ring-red-800"
              onClick={() => {
                router.push('/onedrive-vercel-index-oauth/step-1')
              }}
            >
              <FontAwesomeIcon icon="arrow-left" /> <span>{t('Restart')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="py-1 font-medium">{t('Success! The API returned what we needed.')}</p>
          <ol className="py-1">
            {accessToken && (
              <li>
                <FontAwesomeIcon icon={['far', 'check-circle']} className="text-green-500" />{' '}
                <span>
                  {t('Acquired access_token: ')}
                  <code className="font-mono text-sm opacity-80">{`${accessToken.substring(0, 60)}...`}</code>
                </span>
              </li>
            )}
            {refreshToken && (
              <li>
                <FontAwesomeIcon icon={['far', 'check-circle']} className="text-green-500" />{' '}
                <span>
                  {t('Acquired refresh_token: ')}
                  <code className="font-mono text-sm opacity-80">{`${refreshToken.substring(0, 60)}...`}</code>
                </span>
              </li>
            )}
          </ol>

          <p className="py-1 text-sm font-medium text-teal-500">
            <FontAwesomeIcon icon="exclamation-circle" className="mr-1" />{' '}
            {t('These tokens may take a few seconds to populate after you click the button below. ') +
              t('If you go back home and still see the welcome page telling you to re-authenticate, ') +
              t('revisit home and do a hard refresh.')}
          </p>
          <p className="py-1">
            {t(
              'Final step, click the button below to store these tokens persistently before they expire after {{minutes}} minutes {{seconds}} seconds. ',
              {
                minutes: Math.floor(expiryTimeLeft / 60),
                seconds: expiryTimeLeft - Math.floor(expiryTimeLeft / 60) * 60,
              },
            ) +
              t(
                "Don't worry, after storing them, onedrive-vercel-index will take care of token refreshes and updates after your site goes live.",
              )}
          </p>

          <div className="mb-2 mt-6 text-right">
            <button
              className={`rounded-lg bg-gradient-to-br px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 ${
                buttonError
                  ? 'from-red-500 to-orange-400 focus:ring-red-200 dark:focus:ring-red-800'
                  : 'from-green-500 to-teal-300 focus:ring-green-200 dark:focus:ring-green-800'
              }`}
              onClick={sendAuthTokensToServer}
            >
              {buttonContent}
            </button>
          </div>
        </div>
      )}
    </OAuthPageFrame>
  )
}
