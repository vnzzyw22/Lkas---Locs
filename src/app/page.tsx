import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { FaqSection } from "@/components/site/faq-section";
import { Footer } from "@/components/site/footer";
import { GallerySection } from "@/components/site/gallery-section";
import { Hero } from "@/components/site/hero";
import { Navbar } from "@/components/site/navbar";
import { ServicesSection } from "@/components/site/services-section";
import {
  getActiveServices,
  getBusinessSettings,
  getPublishedGalleryPhotos,
} from "@/lib/supabase/queries";

export default async function Home() {
  const [business, services, photos] = await Promise.all([
    getBusinessSettings(),
    getActiveServices(),
    getPublishedGalleryPhotos(),
  ]);

  return (
    <>
      <Navbar />
      {/* Sanduíche: Hero escura (abertura) -> Serviços/Galeria claras
          (conteúdo funcional) -> Sobre escura (transição, ecoa a Hero) ->
          FAQ claro (pausa antes do fechamento) -> Contato + Rodapé escuros
          (fechamento). Cada seção carrega seu próprio fundo — ver
          DESIGN.md. Footer fica fora do <main> pra manter o papel de
          landmark "contentinfo" (perde esse papel se aninhado dentro de
          main). */}
      <main id="conteudo" className="flex flex-1 flex-col">
        <Hero business={business} photos={photos} />
        <ServicesSection services={services} />
        <GallerySection photos={photos} />
        <AboutSection />
        <FaqSection />
        <ContactSection business={business} />
      </main>
      <Footer business={business} services={services} />
    </>
  );
}
