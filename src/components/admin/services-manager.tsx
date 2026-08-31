"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createService,
  deleteService,
  updateService,
} from "@/app/admin/(painel)/servicos/actions";
import { formatDuration, formatPrice } from "@/lib/format";
import type { AdminService } from "@/lib/supabase/types";

interface ServicesManagerProps {
  services: AdminService[];
}

interface FormState {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  displayOrder: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
  displayOrder: "0",
  active: true,
};

function serviceToForm(service: AdminService): FormState {
  return {
    name: service.name,
    description: service.description ?? "",
    price: String(service.price),
    durationMinutes: String(service.duration_minutes),
    displayOrder: String(service.display_order),
    active: service.active,
  };
}

export function ServicesManager({ services }: ServicesManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  function startCreate() {
    setEditingId("new");
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(service: AdminService) {
    setEditingId(service.id);
    setForm(serviceToForm(service));
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

    setSubmitting(true);
    setError(null);

    const input = {
      name: form.name,
      description: form.description,
      price,
      durationMinutes,
      displayOrder,
      active: form.active,
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
          className="self-start rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + Novo serviço
        </button>
      )}

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-lg flex-col gap-4 rounded-xl border border-neutral-200 p-5"
        >
          <h2 className="font-semibold text-brand-black">
            {editingId === "new" ? "Novo serviço" : "Editar serviço"}
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-black">Nome</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-black">
              Descrição (opcional)
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-black">
                Preço (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-black">
                Duração (min)
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: e.target.value })
                }
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-black">
                Ordem de exibição
              </label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({ ...form, displayOrder: e.target.value })
                }
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 pb-2 text-sm">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {rowError && <p className="text-sm text-red-600">{rowError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Preço</th>
              <th className="py-2 pr-4">Duração</th>
              <th className="py-2 pr-4">Ordem</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-neutral-100">
                <td className="py-2 pr-4 font-medium text-brand-black">
                  {service.name}
                </td>
                <td className="py-2 pr-4">{formatPrice(service.price)}</td>
                <td className="py-2 pr-4">
                  {formatDuration(service.duration_minutes)}
                </td>
                <td className="py-2 pr-4">{service.display_order}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      service.active
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                    }
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="text-brand-red hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service)}
                      className="text-neutral-500 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <p className="py-4 text-sm text-neutral-500">
            Nenhum serviço cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
