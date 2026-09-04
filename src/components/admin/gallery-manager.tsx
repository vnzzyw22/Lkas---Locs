"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  deleteGalleryPhoto,
  updateGalleryPhoto,
  uploadGalleryPhoto,
} from "@/app/admin/(painel)/galeria/actions";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  fieldClass,
  labelClass,
} from "@/components/admin/theme";
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
    <div className={`flex flex-col gap-2 ${cardClass}`}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white/5">
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
        className={fieldClass}
      />
      <p className="text-[11px] leading-snug text-white/40">
        Digite &quot;hero&quot; para exibir no topo do site, ou o nome do
        serviço para exibir na galeria principal
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-white/70">
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
          className={`w-16 ${fieldClass}`}
          title="Ordem de exibição"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 text-center ${buttonPrimaryClass}`}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={buttonSecondaryClass}
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
        className={`flex flex-wrap items-end gap-3 ${cardClass}`}
      >
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Foto</label>
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:tracking-widest file:text-white file:uppercase"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Categoria (opcional)</label>
          <input type="text" name="category" className={fieldClass} />
          <p className="max-w-56 text-[11px] leading-snug text-white/40">
            Digite &quot;hero&quot; para exibir no topo do site, ou o nome do
            serviço para exibir na galeria principal
          </p>
        </div>
        <button type="submit" disabled={uploading} className={buttonPrimaryClass}>
          {uploading ? "Enviando..." : "Enviar foto"}
        </button>
        {uploadError && (
          <p className="w-full text-sm text-red-400">{uploadError}</p>
        )}
      </form>

      {photos.length === 0 ? (
        <p className="text-sm text-white/40">Nenhuma foto na galeria ainda.</p>
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
