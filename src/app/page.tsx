import { AboutSection } from "@/components/site/about-section";
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
      <main className="flex flex-1 flex-col">
        <Hero />
        <ServicesSection services={services} />
        <GallerySection photos={photos} />
        <AboutSection />
        <ContactSection business={business} />
      </main>
      <Footer />
    </>
  );
}
