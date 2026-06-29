"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
        <p className="text-5xl font-bold text-red-500 mb-4">!</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-600 mb-8">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
