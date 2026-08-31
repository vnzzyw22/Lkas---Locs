import { BookingForm } from "@/components/booking/booking-form";
import { getActiveServices } from "@/lib/supabase/queries";

export default async function AgendarPage(props: PageProps<"/agendar">) {
  const searchParams = await props.searchParams;
  const services = await getActiveServices();

  const preselectedParam = searchParams.servico;
  const preselectedServiceId = Array.isArray(preselectedParam)
    ? preselectedParam[0]
    : preselectedParam;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-brand-black sm:text-3xl">
          Agendar <span className="text-brand-red">horário</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Escolha o serviço, a data e o horário. Você confirma o pedido pelo
          WhatsApp e aguarda a confirmação.
        </p>
      </div>

      <BookingForm
        services={services}
        preselectedServiceId={preselectedServiceId}
      />
    </main>
  );
}
