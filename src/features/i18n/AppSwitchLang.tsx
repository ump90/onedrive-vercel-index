'use client'

import { Fragment, useTransition } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { faChevronDown, faLanguage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { setLocaleCookie, useTranslation } from './client'
import { localeLabels, locales, normalizeLocale, stripLocalePrefixFromPathname, type Locale } from './settings'

export default function AppSwitchLang() {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { i18n } = useTranslation()
  const currentLocale = normalizeLocale(i18n.resolvedLanguage || i18n.language)

  const switchLocale = (locale: Locale) => {
    setLocaleCookie(locale)
    void i18n.changeLanguage(locale)

    const query = searchParams?.toString() ?? ''
    const targetPath = stripLocalePrefixFromPathname(pathname)
    const targetUrl = query ? `${targetPath}?${query}` : targetPath

    startTransition(() => {
      router.replace(targetUrl, { scroll: false })
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <Menu>
        <Menu.Button
          className="flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100 hover:opacity-80 disabled:opacity-60 dark:bg-gray-800"
          disabled={isPending}
          title={localeLabels[currentLocale]}
        >
          <FontAwesomeIcon className="h-3 w-3" icon={faLanguage} />
          <FontAwesomeIcon className="ml-1 h-2.5 w-2.5" icon={faChevronDown} />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Menu.Items className="absolute top-0 right-0 z-20 mt-9 w-32 divide-y divide-gray-900/10 overflow-auto rounded-sm border border-gray-900/10 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-500/30 dark:bg-gray-900 dark:text-white">
            {locales.map(locale => (
              <Menu.Item key={locale}>
                <button
                  className={`m-1 w-[calc(100%-0.5rem)] cursor-pointer rounded-sm px-2 py-1 text-left text-sm font-medium hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-600/10 dark:hover:text-blue-400 ${
                    locale === currentLocale ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400' : ''
                  }`}
                  onClick={() => switchLocale(locale)}
                >
                  {localeLabels[locale]}
                </button>
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
