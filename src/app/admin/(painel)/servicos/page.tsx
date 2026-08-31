import { ServicesManager } from "@/components/admin/services-manager";
import { getAllServices } from "@/lib/supabase/admin-queries";

export default async function ServicosPage() {
  const services = await getAllServices();

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">Serviços</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Preço e duração aparecem no site e no agendamento assim que salvos.
      </p>
      <ServicesManager services={services} />
    </div>
  );
}
