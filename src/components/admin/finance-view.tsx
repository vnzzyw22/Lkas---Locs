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

// Medidor de fluxo entradas/saídas (2026-09-08) — troca a barra genérica
// verde/vermelho anterior por algo com cara de painel técnico usando a
// própria identidade da marca: segmentos tipo equalizador acesos em
// brand-red com leve brilho (echo do glow oxblood já usado na Hero
// pública, ver hero.tsx), tipografia mono (font-label) pros números.
const METER_SEGMENTS = 40;

function FlowMeter({ income, expense }: { income: number; expense: number }) {
  const total = income + expense;
  const incomePct = total > 0 ? (income / total) * 100 : 0;
  const expensePct = 100 - incomePct;
  const filledSegments = Math.round((incomePct / 100) * METER_SEGMENTS);

  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-label text-xs tracking-widest uppercase">
        <span className="text-white/40">Fluxo do mês</span>
        <span className="tabular-nums text-white/60">
          <span className="text-brand-red">{Math.round(incomePct)}%</span>{" "}
          entradas
          <span className="mx-2 text-white/20">/</span>
          {Math.round(expensePct)}% saídas
        </span>
      </div>
      <div className="flex h-2 gap-[3px]">
        {Array.from({ length: METER_SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={
              i < filledSegments
                ? "h-full flex-1 rounded-[1px] bg-brand-red shadow-[0_0_6px_var(--color-brand-red)]"
                : "h-full flex-1 rounded-[1px] bg-white/10"
            }
          />
        ))}
      </div>
    </div>
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
        <div className="rounded-lg border border-white/10 border-l-4 border-l-green-500/70 bg-[#1a1a1a] p-5">
          <p className="font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
            Entradas
          </p>
          <p className="mt-2 font-label text-2xl font-bold tabular-nums text-green-400">
            {formatPrice(income)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 border-l-4 border-l-red-500/70 bg-[#1a1a1a] p-5">
          <p className="font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
            Saídas
          </p>
          <p className="mt-2 font-label text-2xl font-bold tabular-nums text-red-400">
            {formatPrice(expense)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 border-l-4 border-l-brand-red bg-[#1a1a1a] p-5">
          <p className="font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
            Saldo
          </p>
          <p className="mt-2 font-label text-2xl font-bold tabular-nums text-white">
            {formatPrice(income - expense)}
          </p>
        </div>
      </div>

      {income + expense > 0 && (
        <FlowMeter income={income} expense={expense} />
      )}

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

      {transactions.length === 0 ? (
        <p className="py-4 text-sm text-white/40">
          Nenhum lançamento nesse mês.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
                  Data
                </th>
                <th className="px-4 py-3 font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
                  Categoria
                </th>
                <th className="px-4 py-3 font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
                  Descrição
                </th>
                <th className="px-4 py-3 text-right font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
                  Valor
                </th>
                <th className="px-4 py-3 text-right font-nav text-xs font-bold tracking-widest text-white/40 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-white/40">
                    {formatDate(t.occurred_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        t.type === "income"
                          ? "rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400"
                          : "rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400"
                      }
                    >
                      {TYPE_LABEL[t.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {t.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white/40">
                    {t.description ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-label tabular-nums ${
                      t.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+ " : "− "}
                    {formatPrice(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className={linkDangerClass}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
