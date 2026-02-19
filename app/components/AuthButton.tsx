"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button onClick={() => signOut()}>
        Sign out ({session.user?.name})
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => signIn("github")}>
        Sign in with GitHub
      </button>
      <button onClick={() => signIn("google")}>
        Sign in with Google
      </button>
    </div>
  );
}
