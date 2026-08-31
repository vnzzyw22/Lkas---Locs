"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createTransaction,
  deleteTransaction,
} from "@/app/admin/(painel)/financeiro/actions";
import { formatPrice } from "@/lib/format";
import type { AdminTransaction, TransactionType } from "@/lib/supabase/types";

interface FinanceViewProps {
  monthISO: string; // "YYYY-MM"
  transactions: AdminTransaction[];
}

const TYPE_LABEL: Record<TransactionType, string> = {
  income: "Entrada",
  expense: "Saída",
};

function shiftMonth(monthISO: string, delta: number) {
  const [year, month] = monthISO.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(`${isoDate}T00:00:00`),
  );
}

export function FinanceView({ monthISO, transactions }: FinanceViewProps) {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToMonth(nextMonthISO: string) {
    router.push(`/admin/financeiro?mes=${nextMonthISO}`);
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createTransaction({
      type,
      category,
      amount: Number(amount.replace(",", ".")),
      description,
      occurredAtISO: occurredAt,
    });

    setSubmitting(false);

    if (result.ok) {
      setCategory("");
      setAmount("");
      setDescription("");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esse lançamento?")) return;
    const result = await deleteTransaction(id);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => goToMonth(shiftMonth(monthISO, -1))}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          ← Mês anterior
        </button>
        <span className="font-medium text-brand-black">{monthISO}</span>
        <button
          type="button"
          onClick={() => goToMonth(shiftMonth(monthISO, 1))}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Próximo mês →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Entradas</p>
          <p className="text-lg font-bold text-green-700">
            {formatPrice(income)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Saídas</p>
          <p className="text-lg font-bold text-red-600">
            {formatPrice(expense)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Saldo</p>
          <p className="text-lg font-bold text-brand-black">
            {formatPrice(income - expense)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
          >
            <option value="income">Entrada</option>
            <option value="expense">Saída</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">Data</label>
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">
            Valor (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-lg border border-neutral-200 px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">
            Categoria
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-1 min-w-40 flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">
            Descrição
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Lançar"}
        </button>

        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2 pr-4">Data</th>
              <th className="py-2 pr-4">Tipo</th>
              <th className="py-2 pr-4">Categoria</th>
              <th className="py-2 pr-4">Descrição</th>
              <th className="py-2 pr-4">Valor</th>
              <th className="py-2 pr-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{formatDate(t.occurred_at)}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      t.type === "income"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                    }
                  >
                    {TYPE_LABEL[t.type]}
                  </span>
                </td>
                <td className="py-2 pr-4">{t.category ?? "—"}</td>
                <td className="py-2 pr-4 text-neutral-500">
                  {t.description ?? "—"}
                </td>
                <td className="py-2 pr-4 font-medium">
                  {formatPrice(t.amount)}
                </td>
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="text-neutral-500 hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <p className="py-4 text-sm text-neutral-500">
            Nenhum lançamento nesse mês.
          </p>
        )}
      </div>
    </div>
  );
}
