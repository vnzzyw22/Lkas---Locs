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
