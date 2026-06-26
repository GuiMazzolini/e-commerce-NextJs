"use client";

import { signIn, signOut, useSession } from "next-auth/react";

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-20 rounded-lg bg-gray-100 animate-pulse" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-purple-600 text-xs font-semibold text-white">
            {initials(session.user?.name)}
          </span>
          <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
            {session.user?.name}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
    >
      Sign in
    </button>
  );
}
