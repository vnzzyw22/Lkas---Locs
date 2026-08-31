import { SettingsForm } from "@/components/admin/settings-form";
import { getBusinessSettings } from "@/lib/supabase/queries";

export default async function ConfiguracoesPage() {
  const business = await getBusinessSettings();

  if (!business) {
    return (
      <div>
        <h1 className="text-xl font-bold text-brand-black">Configurações</h1>
        <p className="mt-2 text-sm text-red-600">
          Não foi possível carregar as configurações do negócio.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">Configurações</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Dados usados no site público e no fluxo de agendamento.
      </p>
      <SettingsForm business={business} />
    </div>
  );
}
