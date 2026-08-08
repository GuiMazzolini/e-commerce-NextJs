"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
};

type FieldErrors = {
  name?: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  stock?: string;
};

export default function ProductForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [id, setId] = useState(initial?.id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "10");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);

  // Use the raw HTTPS URL for the admin preview so a bad transform
  // (or Next/Image quirks) never blank out the thumbnail.
  const previewSrc = useMemo(() => {
    const url = imageUrl.trim();
    return url.startsWith("http") ? url : null;
  }, [imageUrl]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!description.trim()) next.description = "Description is required.";
    if (!imageUrl.trim().startsWith("http")) {
      next.imageUrl = "Upload an image or paste a Cloudinary URL (https://…).";
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      next.price = "Enter a valid non-negative price.";
    }
    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      next.stock = "Stock must be a whole number ≥ 0.";
    }
    return next;
  }

  async function uploadToCloudinary(file: File) {
    setError(null);
    setFieldErrors((prev) => ({ ...prev, imageUrl: undefined }));
    setUploading(true);
    setPreviewBroken(false);

    try {
      const signRes = await fetch("/api/admin/uploads/sign", {
        method: "POST",
        credentials: "include",
      });
      const signData = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        setError(
          typeof signData.error === "string"
            ? signData.error
            : "Could not start image upload"
        );
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", signData.timestamp);
      formData.append("folder", signData.folder);
      formData.append("signature", signData.signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || typeof uploadData.secure_url !== "string") {
        setFieldErrors((prev) => ({
          ...prev,
          imageUrl: "Image upload failed. Try another file.",
        }));
        return;
      }

      setImageUrl(uploadData.secure_url);
    } catch {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: "Image upload failed. Check your connection and try again.",
      }));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      price: Number(price),
      stock: Number(stock),
      ...(mode === "create" && id.trim() ? { id: id.trim() } : {}),
    };

    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initial?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      noValidate
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          required
          aria-invalid={!!fieldErrors.name}
          className={`w-full rounded-lg border px-3 py-2 ${
            fieldErrors.name ? "border-red-400" : "border-gray-300"
          }`}
        />
        {fieldErrors.name && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
        )}
      </div>

      {mode === "create" && (
        <div>
          <label htmlFor="id" className="mb-1 block text-sm font-medium text-gray-700">
            ID (optional)
          </label>
          <input
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Auto-generated from name if empty"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setFieldErrors((prev) => ({ ...prev, description: undefined }));
          }}
          required
          rows={4}
          aria-invalid={!!fieldErrors.description}
          className={`w-full rounded-lg border px-3 py-2 ${
            fieldErrors.description ? "border-red-400" : "border-gray-300"
          }`}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="imageUrl"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Product image
        </label>
        <input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreviewBroken(false);
            setFieldErrors((prev) => ({ ...prev, imageUrl: undefined }));
          }}
          required
          placeholder="https://res.cloudinary.com/…"
          aria-invalid={!!fieldErrors.imageUrl}
          className={`w-full rounded-lg border px-3 py-2 ${
            fieldErrors.imageUrl ? "border-red-400" : "border-gray-300"
          }`}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void uploadToCloudinary(file);
                }
                e.currentTarget.value = "";
              }}
            />
          </label>
          <p className="text-xs text-gray-500">
            Upload to Cloudinary, or paste a Cloudinary URL.
          </p>
        </div>
        {fieldErrors.imageUrl && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.imageUrl}</p>
        )}

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          {previewSrc ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary remote URLs */}
              <img
                key={previewSrc}
                src={previewSrc}
                alt={name || "Product preview"}
                className="h-28 w-28 shrink-0 rounded-lg object-cover bg-white ring-1 ring-gray-200"
                onError={() => setPreviewBroken(true)}
                onLoad={() => setPreviewBroken(false)}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Image preview</p>
                <p className="mt-1 truncate text-xs text-gray-500">{imageUrl}</p>
                {previewBroken && (
                  <p className="mt-2 text-sm text-red-600">
                    Couldn’t load this image — check the URL.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-500">
              No image yet — upload one to see a preview
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
            Price (USD)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setFieldErrors((prev) => ({ ...prev, price: undefined }));
            }}
            required
            aria-invalid={!!fieldErrors.price}
            className={`w-full rounded-lg border px-3 py-2 ${
              fieldErrors.price ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.price && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
          )}
        </div>
        <div>
          <label htmlFor="stock" className="mb-1 block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            id="stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setFieldErrors((prev) => ({ ...prev, stock: undefined }));
            }}
            required
            aria-invalid={!!fieldErrors.stock}
            className={`w-full rounded-lg border px-3 py-2 ${
              fieldErrors.stock ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.stock && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.stock}</p>
          )}
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || uploading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-lg bg-gray-100 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
