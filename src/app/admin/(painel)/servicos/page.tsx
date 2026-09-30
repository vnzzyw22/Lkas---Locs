import { ServicesManager } from "@/components/admin/services-manager";
import { pageSubtitleClass, pageTitleClass } from "@/components/admin/theme";
import {
  getAllProfessionals,
  getAllServices,
} from "@/lib/supabase/admin-queries";

export default async function ServicosPage() {
  const [services, professionals] = await Promise.all([
    getAllServices(),
    getAllProfessionals(),
  ]);

  return (
    <div>
      <h1 className={pageTitleClass}>Serviços</h1>
      <p className={pageSubtitleClass}>
        Preço e duração aparecem no site e no agendamento assim que salvos.
        A duração pode variar pelo tamanho do cabelo.
      </p>
      <ServicesManager services={services} professionals={professionals} />
    </div>
  );
}
