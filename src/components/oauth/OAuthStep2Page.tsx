'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import OAuthPageFrame from './OAuthPageFrame'
import { LoadingIcon } from '../Loading'
import { extractAuthCodeFromRedirected, generateAuthorisationUrl } from '../../utils/oAuthHandler'
import { Trans, useTranslation } from '../../i18n'

export default function OAuthStep2Page() {
  const router = useRouter()
  const [oAuthRedirectedUrl, setOAuthRedirectedUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)
  const { t } = useTranslation()

  const oAuthUrl = generateAuthorisationUrl()

  return (
    <OAuthPageFrame
      illustrationSrc="/images/fabulous-come-back-later.png"
      illustrationAlt="fabulous come back later"
      stepTitle={t('Step 2/3: Get authorisation code')}
    >
      <p className="py-1 text-sm font-medium text-red-400">
        <Trans>
          <FontAwesomeIcon icon="exclamation-circle" className="mr-1" /> If you are not the owner of this website,
          stop now, as continuing with this process may expose your personal files in OneDrive.
        </Trans>
      </p>

      <div
        className="relative my-2 cursor-pointer rounded border border-gray-500/50 bg-gray-50 font-mono text-sm hover:opacity-80 dark:bg-gray-800"
        onClick={() => {
          window.open(oAuthUrl, '_blank', 'noopener,noreferrer')
        }}
      >
        <div className="absolute right-0 top-0 p-1 opacity-60">
          <FontAwesomeIcon icon="external-link-alt" />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap p-2">
          <code>{oAuthUrl}</code>
        </pre>
      </div>

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
        className={`my-2 w-full flex-1 rounded border bg-gray-50 p-2 font-mono text-sm font-medium focus:outline-none focus:ring dark:bg-gray-800 dark:text-white ${
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
          setAuthCode(extractAuthCodeFromRedirected(event.target.value))
        }}
      />

      <p className="py-1">{t('The authorisation code extracted is:')}</p>
      <p className="my-2 overflow-hidden truncate rounded border border-gray-400/20 bg-gray-50 p-2 font-mono text-sm opacity-80 dark:bg-gray-800">
        {authCode || <span className="animate-pulse">{t('Waiting for code...')}</span>}
      </p>

      <p>
        {authCode
          ? t('✅ You can now proceed onto the next step: requesting your access token and refresh token.')
          : t('❌ No valid code extracted.')}
      </p>

      <div className="mb-2 mt-6 text-right">
        <button
          className="rounded-lg bg-gradient-to-br from-green-500 to-cyan-400 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:grayscale dark:focus:ring-green-800"
          disabled={authCode === ''}
          onClick={() => {
            setButtonLoading(true)
            router.push(`/onedrive-vercel-index-oauth/step-3?authCode=${encodeURIComponent(authCode)}`)
          }}
        >
          {buttonLoading ? (
            <>
              <span>{t('Requesting tokens')}</span> <LoadingIcon className="ml-1 inline h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <span>{t('Get tokens')}</span> <FontAwesomeIcon icon="arrow-right" />
            </>
          )}
        </button>
      </div>
    </OAuthPageFrame>
  )
}
