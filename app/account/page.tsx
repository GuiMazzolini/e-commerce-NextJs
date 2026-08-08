import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getAccountProfile } from "@/app/lib/account";
import AccountSections from "./AccountSections";

export const metadata: Metadata = {
  title: "Account Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/account");
  }

  const profile = await getAccountProfile(session.user.email);

  // A session can outlive its user record — the account was deleted in another
  // tab, or predates the signIn upsert that now persists OAuth users.
  if (!profile) {
    redirect("/api/auth/signout?callbackUrl=/");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Account settings</h1>
        <p className="text-gray-600 mb-8">
          Manage your profile, password, and shipping address.
        </p>
        <AccountSections profile={profile} />
      </div>
    </div>
  );
}
