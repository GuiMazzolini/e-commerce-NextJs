"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const CARRIER_SUGGESTIONS = ["DHL", "CTT", "UPS", "FedEx", "Chronopost", "Other"];

export default function ShipOrderForm({
  sessionId,
  initialTracking = "",
  initialCarrier = "",
  alreadyShipped = false,
}: {
  sessionId: string;
  initialTracking?: string;
  initialCarrier?: string;
  alreadyShipped?: boolean;
}) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(sessionId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingNumber,
            carrier: carrier || null,
            sendEmail,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }

      setSuccess(
        sendEmail
          ? "Marked as shipped and customer email queued."
          : "Marked as shipped (no email sent)."
      );
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-900">
        {alreadyShipped ? "Update shipment" : "Mark as shipped"}
      </p>
      <p className="text-xs text-gray-500">
        After you drop the parcel at DHL (or another carrier), paste the tracking
        number here.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">
            Tracking number
          </span>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
            placeholder="e.g. JD014600003456789012"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">
            Carrier (optional)
          </span>
          <input
            list={`carriers-${sessionId}`}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="DHL, CTT…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <datalist id={`carriers-${sessionId}`}>
            {CARRIER_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
          className="rounded border-gray-300"
        />
        Email the customer with tracking details
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !trackingNumber.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading
          ? "Saving…"
          : alreadyShipped
            ? "Update & notify"
            : "Mark shipped"}
      </button>
    </form>
  );
}
