'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-800">
      <div className="w-full max-w-lg rounded-sm bg-white p-4 shadow-sm dark:bg-gray-900 dark:text-white">
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <p className="mt-2 break-all text-sm text-gray-500 dark:text-gray-300">{error.message}</p>
        <button className="mt-4 rounded-sm bg-blue-600 px-4 py-2 text-sm text-white" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  )
}
