"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createService,
  deleteService,
  updateService,
} from "@/app/admin/(painel)/servicos/actions";
import {
  badgeClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  fieldClass,
  labelClass,
  linkDangerClass,
  linkPrimaryClass,
} from "@/components/admin/theme";
import { formatPrice, formatServiceDuration } from "@/lib/format";
import { HAIR_LENGTH_LABELS, HAIR_LENGTHS, type HairLength } from "@/lib/hair-length";
import type { AdminProfessional, AdminService } from "@/lib/supabase/types";

interface ServicesManagerProps {
  services: AdminService[];
  professionals: AdminProfessional[];
}

interface FormState {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  displayOrder: string;
  active: boolean;
  variesByHair: boolean;
  hairDurations: Record<HairLength, string>;
  professionalIds: string[];
}

const EMPTY_HAIR_DURATIONS: Record<HairLength, string> = {
  short: "",
  medium: "",
  long: "",
  very_long: "",
};

function emptyForm(professionals: AdminProfessional[]): FormState {
  return {
    name: "",
    description: "",
    price: "",
    durationMinutes: "",
    displayOrder: "0",
    active: true,
    variesByHair: false,
    hairDurations: EMPTY_HAIR_DURATIONS,
    // Serviço novo já nasce com todos os profissionais ativos marcados — sem
    // nenhum, ele ficaria impossível de agendar pelo site.
    professionalIds: professionals.filter((p) => p.active).map((p) => p.id),
  };
}

function serviceToForm(
  service: AdminService,
  professionals: AdminProfessional[],
): FormState {
  const hairDurations = { ...EMPTY_HAIR_DURATIONS };
  for (const rule of service.hair_durations) {
    hairDurations[rule.hair_length] = String(rule.duration_minutes);
  }

  return {
    name: service.name,
    description: service.description ?? "",
    price: String(service.price),
    durationMinutes: String(service.duration_minutes),
    displayOrder: String(service.display_order),
    active: service.active,
    variesByHair: service.hair_durations.length > 0,
    hairDurations,
    professionalIds: professionals
      .filter((p) => p.service_ids.includes(service.id))
      .map((p) => p.id),
  };
}

export function ServicesManager({ services, professionals }: ServicesManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(professionals));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function startCreate() {
    setEditingId("new");
    setForm(emptyForm(professionals));
    setError(null);
  }

  function startEdit(service: AdminService) {
    setEditingId(service.id);
    setForm(serviceToForm(service, professionals));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;

    const price = Number(form.price.replace(",", "."));
    const durationMinutes = Number(form.durationMinutes);
    const displayOrder = Number(form.displayOrder) || 0;

    const duplicate = services.find(
      (s) => s.display_order === displayOrder && s.id !== editingId,
    );
    if (duplicate) {
      setError(
        `Esse número de ordem já está em uso por "${duplicate.name}". Escolha outro número.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const input = {
      name: form.name,
      description: form.description,
      price,
      durationMinutes,
      displayOrder,
      active: form.active,
      hairDurations: form.variesByHair
        ? (Object.fromEntries(
            HAIR_LENGTHS.map((length) => [
              length,
              Number(form.hairDurations[length]),
            ]),
          ) as Record<HairLength, number>)
        : null,
      professionalIds: form.professionalIds,
    };

    const result =
      editingId === "new"
        ? await createService(input)
        : await updateService(editingId, input);

    setSubmitting(false);

    if (result.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(service: AdminService) {
    if (!confirm(`Excluir "${service.name}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setRowError(null);
    const result = await deleteService(service.id);
    if (result.ok) {
      router.refresh();
    } else {
      setRowError(result.error);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {editingId === null && (
        <button
          type="button"
          onClick={startCreate}
          className={`self-start ${buttonPrimaryClass}`}
        >
          + Novo serviço
        </button>
      )}

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className={`flex max-w-lg flex-col gap-4 ${cardClass}`}
        >
          <h2 className="font-nav text-sm font-bold tracking-widest text-white uppercase">
            {editingId === "new" ? "Novo serviço" : "Editar serviço"}
          </h2>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Descrição (opcional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={fieldClass}
            />
          </div>

          <div className={`grid gap-4 ${form.variesByHair ? "grid-cols-1" : "grid-cols-2"}`}>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Preço (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={fieldClass}
              />
            </div>

            {!form.variesByHair && (
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Duração (min)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                  className={fieldClass}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.variesByHair}
                onChange={(e) =>
                  setForm({
                    ...form,
                    variesByHair: e.target.checked,
                    // Ao ligar pela primeira vez, parte da duração fixa atual
                    // em todos os tamanhos (o admin ajusta o que precisar).
                    hairDurations:
                      e.target.checked &&
                      HAIR_LENGTHS.every((l) => !form.hairDurations[l])
                        ? (Object.fromEntries(
                            HAIR_LENGTHS.map((l) => [l, form.durationMinutes]),
                          ) as Record<HairLength, string>)
                        : form.hairDurations,
                  })
                }
              />
              Duração varia pelo tamanho do cabelo
            </label>

            {form.variesByHair && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-white/40">
                  Tempo em minutos de cada tamanho. O cliente informa o tamanho
                  ao agendar e a agenda reserva o tempo correspondente.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {HAIR_LENGTHS.map((length) => (
                    <div key={length} className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`duracao-${length}`}
                        className={labelClass}
                      >
                        {HAIR_LENGTH_LABELS[length]}
                      </label>
                      <input
                        id={`duracao-${length}`}
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={form.hairDurations[length]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            hairDurations: {
                              ...form.hairDurations,
                              [length]: e.target.value,
                            },
                          })
                        }
                        className={fieldClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {professionals.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className={labelClass}>Quem realiza</span>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {professionals.map((professional) => (
                  <label
                    key={professional.id}
                    className="flex items-center gap-2 text-sm text-white/70"
                  >
                    <input
                      type="checkbox"
                      checked={form.professionalIds.includes(professional.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          professionalIds: e.target.checked
                            ? [...form.professionalIds, professional.id]
                            : form.professionalIds.filter(
                                (id) => id !== professional.id,
                              ),
                        })
                      }
                    />
                    {professional.name}
                    {!professional.active && (
                      <span className="text-white/30">(inativo)</span>
                    )}
                  </label>
                ))}
              </div>
              {form.professionalIds.length === 0 && (
                <p className="text-xs text-amber-400">
                  Sem nenhum profissional, o serviço não pode ser agendado pelo site.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Ordem de exibição</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({ ...form, displayOrder: e.target.value })
                }
                className={fieldClass}
              />
              {(() => {
                const duplicate = services.find(
                  (s) =>
                    s.display_order === Number(form.displayOrder) &&
                    s.id !== editingId,
                );
                return duplicate ? (
                  <p className="text-xs text-amber-400">
                    Número já usado por &quot;{duplicate.name}&quot;.
                  </p>
                ) : null;
              })()}
            </div>

            <label className="flex items-center gap-2 pb-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
              />
              Ativo (visível no site)
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
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
        {services.map((service) => (
          <div
            key={service.id}
            className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${cardClass}`}
          >
            <span className="min-w-32 font-medium text-white">
              {service.name}
            </span>
            <span className="text-white/60">{formatPrice(service.price)}</span>
            <span className="text-white/60">
              {formatServiceDuration(service)}
              {service.hair_durations.length > 0 && (
                <span className="text-white/40"> · por tamanho</span>
              )}
            </span>
            <span className="text-white/40">Ordem {service.display_order}</span>
            <span className={badgeClass(service.active ? "green" : "neutral")}>
              {service.active ? "Ativo" : "Inativo"}
            </span>

            <div className="ml-auto flex gap-4">
              <button
                type="button"
                onClick={() => startEdit(service)}
                className={linkPrimaryClass}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(service)}
                className={linkDangerClass}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <p className="py-4 text-sm text-white/40">
            Nenhum serviço cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
