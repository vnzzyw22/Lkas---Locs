import { AboutSection } from "@/components/site/about-section";
import { BrandOutro } from "@/components/site/brand-outro";
import { ContactSection } from "@/components/site/contact-section";
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
      <main id="conteudo" className="flex flex-1 flex-col">
        <Hero business={business} photos={photos} />
        <ServicesSection services={services} />
        <GallerySection photos={photos} />
      </main>
      {/* Sanduíche: Hero escura (abertura) -> Serviços/Galeria clara
          (conteúdo funcional) -> aqui, escura de novo (fechamento), com o
          vídeo real da marca ao fundo — ver DESIGN.md > Decalque/Brand
          Outro. Fora do <main> pra o Footer manter o papel de landmark
          "contentinfo" (perde esse papel se aninhado dentro de main). */}
      <BrandOutro>
        <AboutSection />
        <ContactSection business={business} />
        <Footer />
      </BrandOutro>
    </>
  );
}
