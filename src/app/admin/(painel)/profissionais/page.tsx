import { ProfessionalsManager } from "@/components/admin/professionals-manager";
import { pageSubtitleClass, pageTitleClass } from "@/components/admin/theme";
import {
  getAllProfessionals,
  getAllServices,
} from "@/lib/supabase/admin-queries";
import { getBusinessSettings } from "@/lib/supabase/queries";

export default async function ProfissionaisPage() {
  const [professionals, services, business] = await Promise.all([
    getAllProfessionals(),
    getAllServices(),
    getBusinessSettings(),
  ]);

  return (
    <div>
      <h1 className={pageTitleClass}>Profissionais</h1>
      <p className={pageSubtitleClass}>
        Cada profissional tem a própria agenda: um horário ocupado de um não
        bloqueia o outro.
      </p>
      <ProfessionalsManager
        professionals={professionals}
        services={services}
        businessHours={business?.business_hours ?? {}}
      />
    </div>
  );
}
