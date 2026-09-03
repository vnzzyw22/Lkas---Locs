"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createTransaction,
  deleteTransaction,
} from "@/app/admin/(painel)/financeiro/actions";
import {
  buttonPrimaryClass,
  cardClass,
  fieldClass,
  filterButtonClass,
  labelClass,
  linkDangerClass,
} from "@/components/admin/theme";
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToMonth(shiftMonth(monthISO, -1))}
          className={filterButtonClass(false)}
        >
          ← Mês anterior
        </button>
        <span className="font-nav text-xs font-bold tracking-widest text-white uppercase">
          {monthISO}
        </span>
        <button
          type="button"
          onClick={() => goToMonth(shiftMonth(monthISO, 1))}
          className={filterButtonClass(false)}
        >
          Próximo mês →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={cardClass}>
          <p className="text-xs text-white/50">Entradas</p>
          <p className="mt-1 text-lg font-bold text-green-400">
            {formatPrice(income)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs text-white/50">Saídas</p>
          <p className="mt-1 text-lg font-bold text-red-400">
            {formatPrice(expense)}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs text-white/50">Saldo</p>
          <p className="mt-1 text-lg font-bold text-white">
            {formatPrice(income - expense)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`flex flex-wrap items-end gap-3 ${cardClass}`}
      >
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className={fieldClass}
          >
            <option value="income">Entrada</option>
            <option value="expense">Saída</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data</label>
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-28 ${fieldClass}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Categoria</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <label className={labelClass}>Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
          />
        </div>

        <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
          {submitting ? "Salvando..." : "Lançar"}
        </button>

        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </form>

      <div className="flex flex-col gap-2">
        {transactions.map((t) => (
          <div
            key={t.id}
            className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${cardClass}`}
          >
            <span className="text-white/40">{formatDate(t.occurred_at)}</span>
            <span
              className={
                t.type === "income"
                  ? "rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400"
                  : "rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400"
              }
            >
              {TYPE_LABEL[t.type]}
            </span>
            <span className="text-white/60">{t.category ?? "—"}</span>
            <span className="text-white/40">{t.description ?? "—"}</span>
            <span className="font-medium text-white">
              {formatPrice(t.amount)}
            </span>

            <button
              type="button"
              onClick={() => handleDelete(t.id)}
              className={`ml-auto ${linkDangerClass}`}
            >
              Excluir
            </button>
          </div>
        ))}

        {transactions.length === 0 && (
          <p className="py-4 text-sm text-white/40">
            Nenhum lançamento nesse mês.
          </p>
        )}
      </div>
    </div>
  );
}
