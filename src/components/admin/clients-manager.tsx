"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deleteClient,
  updateClient,
} from "@/app/admin/(painel)/clientes/actions";
import type { AdminClient } from "@/lib/supabase/types";

interface ClientsManagerProps {
  clients: AdminClient[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function ClientsManager({ clients }: ClientsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.whatsapp?.toLowerCase().includes(term),
    );
  }, [clients, search]);

  function startEdit(client: AdminClient) {
    setEditingId(client.id);
    setName(client.name);
    setWhatsapp(client.whatsapp ?? "");
    setNotes(client.notes ?? "");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setError(null);

    const result = await updateClient(editingId, { name, whatsapp, notes });

    setSubmitting(false);

    if (result.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(client: AdminClient) {
    if (!confirm(`Excluir "${client.name}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    const result = await deleteClient(client.id);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <input
        type="text"
        placeholder="Buscar por nome ou WhatsApp..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm rounded-lg border border-neutral-200 px-3 py-2 text-sm"
      />

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-lg flex-col gap-4 rounded-xl border border-neutral-200 p-5"
        >
          <h2 className="font-semibold text-brand-black">Editar cliente</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-black">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-black">
              WhatsApp
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-brand-black">
              Observações
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
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
              onClick={() => setEditingId(null)}
              className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {editingId === null && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">WhatsApp</th>
              <th className="py-2 pr-4">Observações</th>
              <th className="py-2 pr-4">Desde</th>
              <th className="py-2 pr-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-neutral-100">
                <td className="py-2 pr-4 font-medium text-brand-black">
                  {client.name}
                </td>
                <td className="py-2 pr-4">{client.whatsapp ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">
                  {client.notes ?? "—"}
                </td>
                <td className="py-2 pr-4 text-neutral-500">
                  {formatDate(client.created_at)}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(client)}
                      className="text-brand-red hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(client)}
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

        {filtered.length === 0 && (
          <p className="py-4 text-sm text-neutral-500">
            {clients.length === 0
              ? "Nenhum cliente cadastrado ainda."
              : "Nenhum cliente encontrado."}
          </p>
        )}
      </div>
    </div>
  );
}
