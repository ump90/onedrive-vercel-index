'use client'

import type { ReactNode } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons'
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLinkAlt,
  faKey,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Footer from '../../components/Footer'
import { LoadingIcon } from '../../components/Loading'
import AppSwitchLang from '../i18n/AppSwitchLang'
import { Trans, useTranslation } from '../i18n/client'
import { getAuthPersonInfo, sendTokenToServer } from './oauth-browser'

type OAuthFrameProps = {
  children: ReactNode
  imageAlt: string
  imageSrc: string
  siteIcon: string
  siteTitle: string
  stepTitle: string
}

export type OAuthStep3Result =
  | {
      description: string
      error: string
      errorUri?: string
      ok: false
    }
  | {
      accessToken: string
      expiryTime: number
      ok: true
      refreshToken: string
    }

function extractAuthCodeFromRedirected(url: string, redirectUri: string): string {
  if (!url.startsWith(redirectUri)) {
    return ''
  }

  return new URLSearchParams(url.split('?')[1]).get('code') ?? ''
}

function OAuthNavbar({ siteIcon, siteTitle }: { siteIcon: string; siteTitle: string }) {
  const { t } = useTranslation()

  return (
    <div className="sticky top-0 z-[100] border-b border-gray-900/10 bg-white/80 backdrop-blur-sm dark:border-gray-500/30 dark:bg-gray-900">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 dark:text-white">
          <Image src={siteIcon} alt="" width={24} height={24} priority />
          <span className="hidden font-bold sm:block">{siteTitle}</span>
        </Link>
        <div className="flex items-center gap-2 text-gray-700 dark:text-white">
          <AppSwitchLang />
          <Link
            className="flex h-8 items-center gap-2 rounded-sm bg-gray-100 px-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-white"
            href="/"
          >
            <span>{t('Home')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function OAuthFrame({ children, imageAlt, imageSrc, siteIcon, siteTitle, stepTitle }: OAuthFrameProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
      <main className="flex w-full flex-1 flex-col bg-gray-50 dark:bg-gray-800">
        <OAuthNavbar siteIcon={siteIcon} siteTitle={siteTitle} />
        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="rounded bg-white p-3 shadow-sm dark:bg-gray-900 dark:text-gray-100">
            <div className="mx-auto w-52">
              <Image src={imageSrc} width={912} height={912} alt={imageAlt} priority />
            </div>
            <h1 className="mb-4 text-center text-xl font-medium">
              {t('Welcome to your new onedrive-vercel-index 🎉')}
            </h1>
            <h2 className="mt-4 mb-2 text-lg font-medium">{t(stepTitle)}</h2>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export function OAuthStep1({
  apiConfigRows,
  siteIcon,
  siteTitle,
}: {
  apiConfigRows: Array<{ label: string; value: string }>
  siteIcon: string
  siteTitle: string
}) {
  const { t } = useTranslation()

  return (
    <OAuthFrame
      imageAlt="fabulous fireworks"
      imageSrc="/images/fabulous-fireworks.png"
      siteIcon={siteIcon}
      siteTitle={siteTitle}
      stepTitle="Step 1/3: Preparations"
    >
      <p className="py-1 text-sm font-medium text-yellow-400">
        <Trans>
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> If you have not specified a REDIS_URL inside
          your Vercel env variable, go initialise one at{' '}
          <a href="https://upstash.com/" target="_blank" rel="noopener noreferrer" className="underline">
            Upstash
          </a>
          . Docs:{' '}
          <a
            href="https://docs.upstash.com/redis/howto/vercelintegration"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Vercel Integration - Upstash
          </a>
          .
        </Trans>
      </p>
      <p className="py-1">
        <Trans>
          Authorisation is required as no valid{' '}
          <code className="font-mono text-sm underline decoration-pink-600 decoration-wavy">access_token</code> or{' '}
          <code className="font-mono text-sm underline decoration-green-600 decoration-wavy">refresh_token</code> is
          present on this deployed instance. Check the following configurations before proceeding with authorising
          onedrive-vercel-index with your own Microsoft account.
        </Trans>
      </p>
      <div className="my-4 overflow-hidden">
        <table className="min-w-full table-auto">
          <tbody>
            {apiConfigRows.map(row => (
              <tr key={row.label} className="border-y bg-white dark:border-gray-700 dark:bg-gray-900">
                <td className="bg-gray-50 px-3 py-1 text-left text-xs font-medium tracking-wider text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                  {row.label}
                </td>
                <td className="px-3 py-1 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  <code className="font-mono text-sm">{row.value}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="py-1 text-sm font-medium">
        <Trans>
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-yellow-400" /> If you see anything missing
          or incorrect, you need to reconfigure <code className="font-mono text-xs">/config/api.config.js</code> and
          redeploy this instance.
        </Trans>
      </p>
      <div className="mt-6 mb-2 text-right">
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
          href="/onedrive-vercel-index-oauth/step-2"
        >
          <span>{t('Proceed to OAuth')}</span>
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </div>
    </OAuthFrame>
  )
}

export function OAuthStep2({
  oAuthUrl,
  redirectUri,
  siteIcon,
  siteTitle,
}: {
  oAuthUrl: string
  redirectUri: string
  siteIcon: string
  siteTitle: string
}) {
  const router = useRouter()
  const [oAuthRedirectedUrl, setOAuthRedirectedUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)
  const { t } = useTranslation()

  return (
    <OAuthFrame
      imageAlt="fabulous come back later"
      imageSrc="/images/fabulous-come-back-later.png"
      siteIcon={siteIcon}
      siteTitle={siteTitle}
      stepTitle="Step 2/3: Get authorisation code"
    >
      <p className="py-1 text-sm font-medium text-red-400">
        <Trans>
          <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" /> If you are not the owner of this website, stop
          now, as continuing with this process may expose your personal files in OneDrive.
        </Trans>
      </p>
      <button
        className="relative my-2 w-full cursor-pointer rounded border border-gray-500/50 bg-gray-50 text-left font-mono text-sm hover:opacity-80 dark:bg-gray-800"
        onClick={() => window.open(oAuthUrl)}
      >
        <span className="absolute top-0 right-0 p-1 opacity-60">
          <FontAwesomeIcon icon={faExternalLinkAlt} />
        </span>
        <pre className="overflow-x-auto p-2 whitespace-pre-wrap">
          <code>{oAuthUrl}</code>
        </pre>
      </button>
      <p className="py-1">
        <Trans>
          The OAuth link for getting the authorisation code has been created. Click on the link above to get the{' '}
          <b className="underline decoration-yellow-400 decoration-wavy">authorisation code</b>. Your browser will open
          a new tab to Microsoft&apos;s account login page. After logging in and authenticating with your Microsoft
          account, you will be redirected to a blank page on localhost. Paste{' '}
          <b className="underline decoration-teal-500 decoration-wavy">the entire redirected URL</b> down below.
        </Trans>
      </p>
      <div className="mx-auto my-4 w-2/3 overflow-hidden rounded">
        <Image src="/images/step-2-screenshot.png" width={1466} height={607} alt="step 2 screenshot" />
      </div>
      <input
        className={`my-2 w-full flex-1 rounded border bg-gray-50 p-2 font-mono text-sm font-medium focus:ring focus:outline-none dark:bg-gray-800 dark:text-white ${
          authCode
            ? 'border-green-500/50 focus:ring-green-500/30 dark:focus:ring-green-500/40'
            : 'border-red-500/50 focus:ring-red-500/30 dark:focus:ring-red-500/40'
        }`}
        autoFocus
        type="text"
        placeholder="http://localhost/?code=M.R3_BAY.c0..."
        value={oAuthRedirectedUrl}
        onChange={event => {
          setOAuthRedirectedUrl(event.target.value)
          setAuthCode(extractAuthCodeFromRedirected(event.target.value, redirectUri))
        }}
      />
      <p className="py-1">{t('The authorisation code extracted is:')}</p>
      <p className="my-2 truncate overflow-hidden rounded border border-gray-400/20 bg-gray-50 p-2 font-mono text-sm opacity-80 dark:bg-gray-800">
        {authCode || <span className="animate-pulse">{t('Waiting for code...')}</span>}
      </p>
      <p>
        {authCode
          ? t('✅ You can now proceed onto the next step: requesting your access token and refresh token.')
          : t('❌ No valid code extracted.')}
      </p>
      <div className="mt-6 mb-2 text-right">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-green-500 to-cyan-400 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:grayscale dark:focus:ring-green-800"
          disabled={authCode === ''}
          onClick={() => {
            setButtonLoading(true)
            router.push(`/onedrive-vercel-index-oauth/step-3?authCode=${encodeURIComponent(authCode)}`)
          }}
        >
          {buttonLoading ? (
            <>
              <span>{t('Requesting tokens')}</span>
              <LoadingIcon className="ml-1 inline h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <span>{t('Get tokens')}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </>
          )}
        </button>
      </div>
    </OAuthFrame>
  )
}

export function OAuthStep3({
  profileApi,
  result,
  siteIcon,
  siteTitle,
  userPrincipalName,
}: {
  profileApi: string
  result: OAuthStep3Result
  siteIcon: string
  siteTitle: string
  userPrincipalName: string
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const [expiryTimeLeft, setExpiryTimeLeft] = useState(result.ok ? result.expiryTime : 0)
  const [buttonState, setButtonState] = useState<'idle' | 'storing' | 'stored' | 'validation-error' | 'store-error'>(
    'idle',
  )

  useEffect(() => {
    if (!expiryTimeLeft) {
      return
    }

    const intervalId = window.setInterval(() => {
      setExpiryTimeLeft(current => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [expiryTimeLeft])

  const sendAuthTokensToServer = async () => {
    if (!result.ok) {
      return
    }

    setButtonState('storing')

    try {
      const { data, status } = await getAuthPersonInfo({ accessToken: result.accessToken, profileApi })

      if (status !== 200) {
        setButtonState('validation-error')
        return
      }

      if (data.userPrincipalName !== userPrincipalName) {
        setButtonState('validation-error')
        return
      }

      await sendTokenToServer({
        accessToken: result.accessToken,
        expiryTime: result.expiryTime,
        refreshToken: result.refreshToken,
      })
      setButtonState('stored')
      window.setTimeout(() => router.push('/'), 2000)
    } catch {
      setButtonState('store-error')
    }
  }

  const buttonError = buttonState === 'validation-error' || buttonState === 'store-error'
  const buttonContent =
    buttonState === 'storing' ? (
      <>
        <span>{t('Storing tokens')}</span>
        <LoadingIcon className="ml-1 inline h-4 w-4 animate-spin" />
      </>
    ) : buttonState === 'stored' ? (
      <>
        <span>{t('Stored! Going home...')}</span>
        <FontAwesomeIcon icon={faCheck} />
      </>
    ) : buttonState === 'validation-error' ? (
      <>
        <span>{t('Error validating identify, restart')}</span>
        <FontAwesomeIcon icon={faExclamationCircle} />
      </>
    ) : buttonState === 'store-error' ? (
      <>
        <span>{t('Error storing the token')}</span>
        <FontAwesomeIcon icon={faExclamationCircle} />
      </>
    ) : (
      <>
        <span>{t('Store tokens')}</span>
        <FontAwesomeIcon icon={faKey} />
      </>
    )

  return (
    <OAuthFrame
      imageAlt="fabulous celebration"
      imageSrc="/images/fabulous-celebration.png"
      siteIcon={siteIcon}
      siteTitle={siteTitle}
      stepTitle="Step 3/3: Get access and refresh tokens"
    >
      {!result.ok ? (
        <div>
          <p className="py-1 font-medium text-red-500">
            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
            <span>{t('Whoops, looks like we got a problem: {{error}}.', { error: t(result.error) })}</span>
          </p>
          <p className="my-2 rounded border border-gray-400/20 bg-gray-50 p-2 font-mono text-sm whitespace-pre-line opacity-80 dark:bg-gray-800">
            {t(result.description)}
          </p>
          {result.errorUri && (
            <p>
              <Trans>
                Check out{' '}
                <a
                  href={result.errorUri}
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
          <div className="mt-6 mb-2 text-right">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:grayscale dark:focus:ring-red-800"
              href="/onedrive-vercel-index-oauth/step-1"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>{t('Restart')}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="py-1 font-medium">{t('Success! The API returned what we needed.')}</p>
          <ol className="py-1">
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />{' '}
              <span>
                {t('Acquired access_token: ')}
                <code className="font-mono text-sm opacity-80">{`${result.accessToken.substring(0, 60)}...`}</code>
              </span>
            </li>
            <li>
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />{' '}
              <span>
                {t('Acquired refresh_token: ')}
                <code className="font-mono text-sm opacity-80">{`${result.refreshToken.substring(0, 60)}...`}</code>
              </span>
            </li>
          </ol>
          <p className="py-1 text-sm font-medium text-teal-500">
            <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{' '}
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
          <div className="mt-6 mb-2 text-right">
            <button
              className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-br px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 ${
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
    </OAuthFrame>
  )
}
