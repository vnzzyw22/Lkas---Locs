import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { FaqSection } from "@/components/site/faq-section";
import { Footer } from "@/components/site/footer";
import { GallerySection } from "@/components/site/gallery-section";
import { Hero } from "@/components/site/hero";
import { Navbar } from "@/components/site/navbar";
import { ServicesSection } from "@/components/site/services-section";
import { toSchemaOpeningHours } from "@/lib/business-hours";
import { getSiteUrl } from "@/lib/site-url";
import {
  getActiveServices,
  getBusinessSettings,
  getHeroGalleryPhotos,
  getPublicGalleryPhotos,
} from "@/lib/supabase/queries";

export default async function Home() {
  const [business, services, heroPhotos, galleryPhotos] = await Promise.all([
    getBusinessSettings(),
    getActiveServices(),
    getHeroGalleryPhotos(),
    getPublicGalleryPhotos(),
  ]);

  // Dados estruturados (schema.org HairSalon) — ajuda o Google a entender
  // que é um negócio local (endereço, telefone, horário), melhora a chance
  // de aparecer em busca/mapa local. Só monta os campos que a gente
  // realmente tem; nada inventado.
  const jsonLd = business
    ? {
        "@context": "https://schema.org",
        "@type": "HairSalon",
        name: business.name,
        url: getSiteUrl(),
        ...(business.address && { address: business.address }),
        ...(business.whatsapp && { telephone: business.whatsapp }),
        ...(Object.keys(business.business_hours ?? {}).length > 0 && {
          openingHoursSpecification: toSchemaOpeningHours(
            business.business_hours,
          ),
        }),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Navbar />
      {/* Sanduíche: Hero escura (abertura) -> Serviços/Galeria claras
          (conteúdo funcional) -> Sobre escura (transição, ecoa a Hero) ->
          FAQ claro (pausa antes do fechamento) -> Contato + Rodapé escuros
          (fechamento). Cada seção carrega seu próprio fundo — ver
          DESIGN.md. Footer fica fora do <main> pra manter o papel de
          landmark "contentinfo" (perde esse papel se aninhado dentro de
          main). */}
      <main id="conteudo" className="flex flex-1 flex-col">
        <Hero business={business} photos={heroPhotos} />
        <ServicesSection services={services} />
        <GallerySection photos={galleryPhotos} />
        <AboutSection />
        <FaqSection />
        <ContactSection business={business} />
      </main>
      <Footer business={business} services={services} />
    </>
  );
}
