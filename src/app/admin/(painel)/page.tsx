import Link from "next/link";
import { currentMonthISO, todayISO } from "@/lib/date";
import { formatPrice } from "@/lib/format";
import {
  getAppointmentsForRange,
  getTransactionsForRange,
} from "@/lib/supabase/admin-queries";
import type { AdminAppointment, AppointmentStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function lastDayOfMonth(monthISO: string) {
  const [year, month] = monthISO.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function AppointmentRow({ appointment }: { appointment: AdminAppointment }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 p-3 text-sm">
      <span className="font-medium text-brand-black">
        {dateLabel(appointment.starts_at)} {timeLabel(appointment.starts_at)}
      </span>
      <span>{appointment.client?.name ?? "Cliente removido"}</span>
      <span className="text-neutral-500">
        {appointment.service?.name ?? "Serviço removido"}
      </span>
      <span
        className={`ml-auto rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[appointment.status]}`}
      >
        {STATUS_LABEL[appointment.status]}
      </span>
    </div>
  );
}

export default async function DashboardPage() {
  const todayDate = todayISO();
  const monthISO = currentMonthISO();

  const todayStartISO = `${todayDate}T00:00:00-03:00`;
  const todayEndISO = `${todayDate}T23:59:59-03:00`;

  const upcomingEnd = new Date();
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);
  const upcomingEndISO = `${upcomingEnd.toISOString().slice(0, 10)}T23:59:59-03:00`;

  const monthStart = `${monthISO}-01`;
  const monthEnd = `${monthISO}-${String(lastDayOfMonth(monthISO)).padStart(2, "0")}`;

  const [todayAppointments, upcomingAppointments, transactions] =
    await Promise.all([
      getAppointmentsForRange(todayStartISO, todayEndISO),
      getAppointmentsForRange(todayEndISO, upcomingEndISO),
      getTransactionsForRange(monthStart, monthEnd),
    ]);

  const activeTodayAppointments = todayAppointments.filter(
    (a) => a.status !== "cancelled",
  );
  const activeUpcomingAppointments = upcomingAppointments.filter(
    (a) => a.status !== "cancelled",
  );

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-brand-black">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-500">Resumo do negócio.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Entradas do mês</p>
          <p className="text-lg font-bold text-green-700">
            {formatPrice(income)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Saídas do mês</p>
          <p className="text-lg font-bold text-red-600">
            {formatPrice(expense)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Saldo do mês</p>
          <p className="text-lg font-bold text-brand-black">
            {formatPrice(income - expense)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-black">Hoje</h2>
          <Link
            href="/admin/agenda"
            className="text-sm text-brand-red hover:underline"
          >
            Ver agenda
          </Link>
        </div>

        {activeTodayAppointments.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum atendimento hoje.
          </p>
        ) : (
          activeTodayAppointments.map((a) => (
            <AppointmentRow key={a.id} appointment={a} />
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-brand-black">
          Próximos 7 dias
        </h2>

        {activeUpcomingAppointments.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum atendimento agendado.
          </p>
        ) : (
          activeUpcomingAppointments.map((a) => (
            <AppointmentRow key={a.id} appointment={a} />
          ))
        )}
      </div>
    </div>
  );
}
