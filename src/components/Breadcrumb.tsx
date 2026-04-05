import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from '../i18n'

const HomeCrumb = () => {
  const { t } = useTranslation()

  return (
    <Link href="/" className="flex items-center">
      <FontAwesomeIcon className="h-3 w-3" icon={['far', 'flag']} />
      <span className="ml-2 font-medium">{t('Home')}</span>
    </Link>
  )
}

const Breadcrumb: React.FC<{ pathSegments?: string[] }> = ({ pathSegments }) => {
  if (pathSegments?.length) {
    // We are rendering the path in reverse, so that the browser automatically scrolls to the end of the breadcrumb
    // https://stackoverflow.com/questions/18614301/keep-overflow-div-scrolled-to-bottom-unless-user-scrolls-up/18614561
    return (
      <ol className="no-scrollbar inline-flex flex-row-reverse items-center gap-1 overflow-x-scroll text-sm text-gray-600 md:gap-3 dark:text-gray-300">
        {pathSegments
          .slice(0)
          .reverse()
          .map((segment, i) => (
            <li key={`${segment}-${i}`} className="flex flex-shrink-0 items-center">
              <FontAwesomeIcon className="h-3 w-3" icon="angle-right" />
              <Link
                href={`/${pathSegments
                  .slice(0, pathSegments.length - i)
                  .map(part => encodeURIComponent(part))
                  .join('/')}`}
                className={`ml-1 transition-all duration-75 hover:opacity-70 md:ml-3 ${
                  i == 0 && 'pointer-events-none opacity-80'
                }`}
              >
                {segment}
              </Link>
            </li>
          ))}
        <li className="flex-shrink-0 transition-all duration-75 hover:opacity-80">
          <HomeCrumb />
        </li>
      </ol>
    )
  }

  return (
    <div className="text-sm text-gray-600 transition-all duration-75 hover:opacity-80 dark:text-gray-300">
      <HomeCrumb />
    </div>
  )
}

export default Breadcrumb
