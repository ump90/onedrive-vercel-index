'use client'

import type { PropsWithChildren } from 'react'

import Image from 'next/image'

import Navbar from '../Navbar'
import Footer from '../Footer'
import { useTranslation } from '../../i18n'

type OAuthPageFrameProps = PropsWithChildren<{
  illustrationSrc: string
  illustrationAlt: string
  stepTitle: string
}>

export default function OAuthPageFrame({
  illustrationSrc,
  illustrationAlt,
  stepTitle,
  children,
}: OAuthPageFrameProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
      <main className="flex w-full flex-1 flex-col bg-gray-50 dark:bg-gray-800">
        <Navbar />

        <div className="mx-auto w-full max-w-5xl p-4">
          <div className="rounded bg-white p-3 dark:bg-gray-900 dark:text-gray-100">
            <div className="mx-auto w-52">
              <Image src={illustrationSrc} width={912} height={912} alt={illustrationAlt} priority />
            </div>
            <h3 className="mb-4 text-center text-xl font-medium">{t('Welcome to your new onedrive-vercel-index 🎉')}</h3>

            <h3 className="mb-2 mt-4 text-lg font-medium">{stepTitle}</h3>

            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
