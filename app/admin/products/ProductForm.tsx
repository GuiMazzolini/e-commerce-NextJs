"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { getImageSrc } from "@/app/lib/images";

export type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadToCloudinary(file: File) {
    setError(null);
    setUploading(true);

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
        setError("Cloudinary upload failed");
        return;
      }

      setImageUrl(uploadData.secure_url);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!imageUrl.trim().startsWith("http")) {
      setLoading(false);
      setError(
        "Image URL must be a Cloudinary URL (it should start with https://). Use “Upload with Cloudinary”."
      );
      return;
    }

    const payload = {
      name,
      description,
      imageUrl,
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
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
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
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-gray-700">
          Image filename or URL
        </label>
        <input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          placeholder="https://res.cloudinary.com/…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {uploading ? "Uploading..." : "Upload with Cloudinary"}
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
            Upload directly to Cloudinary (recommended) or paste a Cloudinary URL.
          </p>
        </div>
        {imageUrl && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="relative aspect-square w-32 overflow-hidden rounded-lg bg-white">
              <Image
                src={getImageSrc(imageUrl)}
                alt={name || "Product preview"}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          </div>
        )}
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
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
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
            onChange={(e) => setStock(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
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
