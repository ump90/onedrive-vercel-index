import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-800">
      <div className="w-full max-w-lg rounded-sm bg-white p-4 shadow-sm dark:bg-gray-900 dark:text-white">
        <h2 className="text-lg font-bold">Not found</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">This OneDrive item could not be found.</p>
        <Link className="mt-4 inline-block rounded-sm bg-blue-600 px-4 py-2 text-sm text-white" href="/">
          Home
        </Link>
      </div>
    </div>
  )
}
