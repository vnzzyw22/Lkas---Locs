"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createProfessional,
  deleteProfessional,
  updateProfessional,
  uploadProfessionalPhoto,
} from "@/app/admin/(painel)/profissionais/actions";
import {
  HoursEditor,
  toBusinessHours,
  toHoursState,
  type HoursState,
} from "@/components/admin/hours-editor";
import {
  badgeClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  fieldClass,
  labelClass,
  linkDangerClass,
  linkPrimaryClass,
  sectionTitleClass,
} from "@/components/admin/theme";
import type {
  AdminProfessional,
  AdminService,
  BusinessHours,
} from "@/lib/supabase/types";

interface ProfessionalsManagerProps {
  professionals: AdminProfessional[];
  services: AdminService[];
  businessHours: BusinessHours;
}

interface FormState {
  name: string;
  bio: string;
  photoUrl: string | null;
  active: boolean;
  displayOrder: string;
  ownHours: boolean;
  hours: HoursState;
  serviceIds: string[];
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] font-nav text-sm font-bold text-white/70 uppercase">
      {photoUrl ? (
        <Image src={photoUrl} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        name.trim().charAt(0)
      )}
    </span>
  );
}

export function ProfessionalsManager({
  professionals,
  services,
  businessHours,
}: ProfessionalsManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function startCreate() {
    setEditingId("new");
    setForm({
      name: "",
      bio: "",
      photoUrl: null,
      active: true,
      displayOrder: String(professionals.length + 1),
      ownHours: false,
      hours: toHoursState(businessHours),
      serviceIds: [],
    });
    setError(null);
  }

  function startEdit(professional: AdminProfessional) {
    setEditingId(professional.id);
    setForm({
      name: professional.name,
      bio: professional.bio ?? "",
      photoUrl: professional.photo_url,
      active: professional.active,
      displayOrder: String(professional.display_order),
      ownHours: professional.working_hours !== null,
      hours: toHoursState(professional.working_hours ?? businessHours),
      serviceIds: professional.service_ids,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(null);
    setError(null);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProfessionalPhoto(formData);
    setUploading(false);
    e.target.value = "";

    if (result.ok) setForm({ ...form, photoUrl: result.url });
    else setError(result.error);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null || !form) return;

    setSubmitting(true);
    setError(null);

    const input = {
      name: form.name,
      bio: form.bio,
      photoUrl: form.photoUrl,
      active: form.active,
      displayOrder: Number(form.displayOrder) || 0,
      workingHours: form.ownHours ? toBusinessHours(form.hours) : null,
      serviceIds: form.serviceIds,
    };

    const result =
      editingId === "new"
        ? await createProfessional(input)
        : await updateProfessional(editingId, input);

    setSubmitting(false);

    if (result.ok) {
      cancelEdit();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(professional: AdminProfessional) {
    if (
      !confirm(`Excluir "${professional.name}"? Essa ação não pode ser desfeita.`)
    ) {
      return;
    }

    setRowError(null);
    const result = await deleteProfessional(professional.id);
    if (result.ok) router.refresh();
    else setRowError(result.error);
  }

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name;

  return (
    <div className="mt-6 flex flex-col gap-6">
      {editingId === null && (
        <button
          type="button"
          onClick={startCreate}
          className={`self-start ${buttonPrimaryClass}`}
        >
          + Novo profissional
        </button>
      )}

      {editingId !== null && form && (
        <form
          onSubmit={handleSubmit}
          className={`flex max-w-xl flex-col gap-5 ${cardClass}`}
        >
          <h2 className={sectionTitleClass}>
            {editingId === "new" ? "Novo profissional" : "Editar profissional"}
          </h2>

          <div className="flex items-center gap-4">
            <Avatar name={form.name || "?"} photoUrl={form.photoUrl} />
            <label className={`cursor-pointer ${buttonSecondaryClass}`}>
              {uploading ? "Enviando..." : form.photoUrl ? "Trocar foto" : "Adicionar foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            {form.photoUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, photoUrl: null })}
                className={linkDangerClass}
              >
                Remover
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="prof-nome" className={labelClass}>
              Nome
            </label>
            <input
              id="prof-nome"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="prof-bio" className={labelClass}>
              Especialidades (opcional)
            </label>
            <textarea
              id="prof-bio"
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="prof-ordem" className={labelClass}>
                Ordem de exibição
              </label>
              <input
                id="prof-ordem"
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({ ...form, displayOrder: e.target.value })
                }
                className={fieldClass}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo (recebe agendamentos)
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className={labelClass}>Serviços que realiza</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-2 text-sm text-white/70"
                >
                  <input
                    type="checkbox"
                    checked={form.serviceIds.includes(service.id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        serviceIds: e.target.checked
                          ? [...form.serviceIds, service.id]
                          : form.serviceIds.filter((id) => id !== service.id),
                      })
                    }
                  />
                  {service.name}
                  {!service.active && (
                    <span className="text-white/30">(inativo)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className={labelClass}>Horário de trabalho</span>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={!form.ownHours}
                onChange={(e) =>
                  setForm({ ...form, ownHours: !e.target.checked })
                }
              />
              Segue o horário do estúdio
            </label>
            {form.ownHours && (
              <>
                <p className="text-xs text-white/40">
                  Vale só dentro do horário de funcionamento do estúdio. Folgas
                  pontuais: Agenda → + Bloquear.
                </p>
                <HoursEditor
                  hours={form.hours}
                  onChange={(hours) => setForm({ ...form, hours })}
                  openLabel="Trabalha"
                />
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || uploading}
              className={buttonPrimaryClass}
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={cancelEdit} className={buttonSecondaryClass}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {rowError && <p className="text-sm text-red-400">{rowError}</p>}

      <div className="flex flex-col gap-2">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-sm ${cardClass}`}
          >
            <Avatar name={professional.name} photoUrl={professional.photo_url} />
            <div className="flex min-w-40 flex-1 flex-col gap-0.5">
              <span className="font-medium text-white">{professional.name}</span>
              <span className="text-xs text-white/50">
                {professional.service_ids.length === 0
                  ? "Nenhum serviço"
                  : professional.service_ids
                      .map(serviceName)
                      .filter(Boolean)
                      .join(", ")}
              </span>
            </div>
            <span className="text-white/40">
              {professional.working_hours ? "Horário próprio" : "Horário do estúdio"}
            </span>
            <span className={badgeClass(professional.active ? "green" : "neutral")}>
              {professional.active ? "Ativo" : "Inativo"}
            </span>

            <div className="ml-auto flex gap-4">
              <button
                type="button"
                onClick={() => startEdit(professional)}
                className={linkPrimaryClass}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(professional)}
                className={linkDangerClass}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {professionals.length === 0 && (
          <p className="py-4 text-sm text-white/40">
            Nenhum profissional cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
