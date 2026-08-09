"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { AccountProfile } from "@/app/lib/account";
import type { SavedAddress } from "@/app/lib/db-collections";

const INPUT =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const LABEL = "mb-1 block text-sm font-medium text-gray-700";
const PRIMARY =
  "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:pointer-events-none";

/** Countries Checkout accepts, so a saved address can always be used there. */
const COUNTRIES = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["BR", "Brazil"], ["PT", "Portugal"], ["DE", "Germany"],
  ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"], ["NL", "Netherlands"],
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Feedback({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
        {success}
      </p>
    );
  }
  return null;
}

async function submit(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Something went wrong");
  }
  return data;
}

export default function AccountSections({ profile }: { profile: AccountProfile }) {
  const [hasPassword, setHasPassword] = useState(profile.hasPassword);

  return (
    <div className="space-y-6">
      <ProfileSection profile={profile} />
      <PasswordSection hasPassword={hasPassword} onSet={() => setHasPassword(true)} />
      <AddressSection initial={profile.address} />
      <DangerSection />
    </div>
  );
}

function ProfileSection({ profile }: { profile: AccountProfile }) {
  const { update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [state, setState] = useState<{ error?: string | null; success?: string | null }>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({});
    setSaving(true);
    try {
      await submit("/api/account/profile", "PATCH", { name: name.trim() });
      // Push the new name into the JWT so the navbar updates without re-login.
      await update({ name: name.trim() });
      router.refresh();
      setState({ success: "Profile updated." });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Profile" description="This name appears in the navbar and on your order emails.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="acct-name" className={LABEL}>Display name</label>
          <input
            id="acct-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="acct-email" className={LABEL}>Email</label>
          <input
            id="acct-email"
            value={profile.email}
            readOnly
            disabled
            className={`${INPUT} cursor-not-allowed bg-gray-50 text-gray-500`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Your email identifies your cart and order history, so it can&apos;t be
            changed here. Contact support if you need it updated.
          </p>
        </div>

        <button type="submit" disabled={saving || !name.trim()} className={PRIMARY}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        <Feedback {...state} />
      </form>
    </Section>
  );
}

function PasswordSection({
  hasPassword,
  onSet,
}: {
  hasPassword: boolean;
  onSet: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<{ error?: string | null; success?: string | null }>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({});

    if (next !== confirm) {
      setState({ error: "The new passwords do not match." });
      return;
    }

    setSaving(true);
    try {
      await submit("/api/account/password", "PUT", {
        ...(hasPassword ? { currentPassword: current } : {}),
        newPassword: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      onSet();
      setState({ success: hasPassword ? "Password changed." : "Password set." });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title={hasPassword ? "Password" : "Set a password"}
      description={
        hasPassword
          ? "Choose a new password of at least 8 characters."
          : "You signed in with a social account. Setting a password lets you also sign in with your email — your social login keeps working."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {hasPassword && (
          <div>
            <label htmlFor="acct-current" className={LABEL}>Current password</label>
            <input
              id="acct-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className={INPUT}
            />
          </div>
        )}

        <div>
          <label htmlFor="acct-new" className={LABEL}>New password</label>
          <input
            id="acct-new"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="acct-confirm" className={LABEL}>Confirm new password</label>
          <input
            id="acct-confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={INPUT}
          />
        </div>

        <button type="submit" disabled={saving} className={PRIMARY}>
          {saving ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </button>
        <Feedback {...state} />
      </form>
    </Section>
  );
}

function AddressSection({ initial }: { initial: SavedAddress | null }) {
  const router = useRouter();
  const [address, setAddress] = useState<SavedAddress>(
    initial ?? {
      line1: "", line2: null, city: "", state: null, postalCode: "", country: "US",
    }
  );
  const [state, setState] = useState<{ error?: string | null; success?: string | null }>({});
  const [saving, setSaving] = useState(false);

  function field(key: keyof SavedAddress) {
    return {
      value: address[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setAddress((a) => ({ ...a, [key]: e.target.value })),
      className: INPUT,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({});
    setSaving(true);
    try {
      await submit("/api/account/address", "PUT", address);
      router.refresh();
      setState({ success: "Address saved. Checkout will prefill it." });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    setState({});
    setSaving(true);
    try {
      await submit("/api/account/address", "DELETE");
      setAddress({ line1: "", line2: null, city: "", state: null, postalCode: "", country: "US" });
      router.refresh();
      setState({ success: "Address removed." });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Could not remove" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Shipping address"
      description="Saved to your Stripe customer record, so it prefills at checkout. You can still change it during payment."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="addr-line1" className={LABEL}>Address line 1</label>
          <input id="addr-line1" required maxLength={200} {...field("line1")} />
        </div>
        <div>
          <label htmlFor="addr-line2" className={LABEL}>
            Address line 2 <span className="text-gray-400">(optional)</span>
          </label>
          <input id="addr-line2" maxLength={200} {...field("line2")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="addr-city" className={LABEL}>City</label>
            <input id="addr-city" required maxLength={100} {...field("city")} />
          </div>
          <div>
            <label htmlFor="addr-state" className={LABEL}>
              State / Province <span className="text-gray-400">(optional)</span>
            </label>
            <input id="addr-state" maxLength={100} {...field("state")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="addr-postal" className={LABEL}>Postal code</label>
            <input id="addr-postal" required maxLength={20} {...field("postalCode")} />
          </div>
          <div>
            <label htmlFor="addr-country" className={LABEL}>Country</label>
            <select id="addr-country" required {...field("country")}>
              {COUNTRIES.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className={PRIMARY}>
            {saving ? "Saving…" : "Save address"}
          </button>
          {initial && (
            <button
              type="button"
              onClick={onRemove}
              disabled={saving}
              className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              Remove address
            </button>
          )}
        </div>
        <Feedback {...state} />
      </form>
    </Section>
  );
}

function DangerSection() {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setError(null);
    setDeleting(true);
    try {
      await submit("/api/account", "DELETE");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-red-700">Delete account</h2>
      <p className="mt-1 text-sm text-gray-600">
        Permanently deletes your account and saved cart. Past orders are kept as
        purchase records — you can still find them with your email and order
        reference on the guest lookup page.
      </p>

      <div className="mt-5">
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <label htmlFor="confirm-delete" className={LABEL}>
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </label>
            <input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={`${INPUT} max-w-xs`}
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={deleting}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
            <Feedback error={error} />
          </div>
        )}
      </div>
    </section>
  );
}
