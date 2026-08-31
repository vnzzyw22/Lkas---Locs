import { ClientsManager } from "@/components/admin/clients-manager";
import { getAllClients } from "@/lib/supabase/admin-queries";

export default async function ClientesPage() {
  const clients = await getAllClients();

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">Clientes</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Clientes cadastrados a cada agendamento pelo site.
      </p>
      <ClientsManager clients={clients} />
    </div>
  );
}
