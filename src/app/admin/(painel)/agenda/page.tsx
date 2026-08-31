import { AgendaView } from "@/components/admin/agenda-view";
import { todayISO } from "@/lib/date";
import {
  getAppointmentsForRange,
  getBlockedSlotsForRange,
} from "@/lib/supabase/admin-queries";

export default async function AgendaPage(props: PageProps<"/admin/agenda">) {
  const searchParams = await props.searchParams;
  const dataParam = searchParams.data;
  const dateISO =
    (Array.isArray(dataParam) ? dataParam[0] : dataParam) || todayISO();

  const dayStartISO = `${dateISO}T00:00:00-03:00`;
  const dayEndISO = `${dateISO}T23:59:59-03:00`;

  const [appointments, blockedSlots] = await Promise.all([
    getAppointmentsForRange(dayStartISO, dayEndISO),
    getBlockedSlotsForRange(dayStartISO, dayEndISO),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">Agenda</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Confirme ou cancele agendamentos e bloqueie horários manualmente.
      </p>
      <AgendaView
        dateISO={dateISO}
        appointments={appointments}
        blockedSlots={blockedSlots}
      />
    </div>
  );
}
