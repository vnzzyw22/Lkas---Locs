"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  deleteGalleryPhoto,
  updateGalleryPhoto,
  uploadGalleryPhoto,
} from "@/app/admin/(painel)/galeria/actions";
import type { AdminGalleryPhoto } from "@/lib/supabase/types";

interface GalleryManagerProps {
  photos: AdminGalleryPhoto[];
}

function PhotoCard({ photo }: { photo: AdminGalleryPhoto }) {
  const router = useRouter();
  const [category, setCategory] = useState(photo.category ?? "");
  const [published, setPublished] = useState(photo.published);
  const [displayOrder, setDisplayOrder] = useState(String(photo.display_order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const result = await updateGalleryPhoto(photo.id, {
      category,
      published,
      displayOrder: Number(displayOrder) || 0,
    });

    setSaving(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  async function handleDelete() {
    if (!confirm("Excluir essa foto? Essa ação não pode ser desfeita.")) return;

    const result = await deleteGalleryPhoto(photo.id, photo.url);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={photo.url}
          alt={category || "Foto da galeria"}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      </div>

      <input
        type="text"
        placeholder="Categoria"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
      />

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publicada
        </label>
        <input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          className="w-16 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          title="Ordem de exibição"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-full bg-brand-red px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export function GalleryManager({ photos }: GalleryManagerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);

    const result = await uploadGalleryPhoto(new FormData(e.currentTarget));

    setUploading(false);

    if (result.ok) {
      formRef.current?.reset();
      router.refresh();
    } else {
      setUploadError(result.error);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form
        ref={formRef}
        onSubmit={handleUpload}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">Foto</label>
          <input type="file" name="file" accept="image/*" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">
            Categoria (opcional)
          </label>
          <input
            type="text"
            name="category"
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Enviar foto"}
        </button>
        {uploadError && (
          <p className="w-full text-sm text-red-600">{uploadError}</p>
        )}
      </form>

      {photos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhuma foto na galeria ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
