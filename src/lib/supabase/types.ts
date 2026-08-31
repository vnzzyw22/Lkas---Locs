// Tipos manuais espelhando supabase/migrations/20260828120000_schema_fase1.sql.
// Cobrem só as colunas usadas pelo site público por enquanto.

export type BusinessHours = Record<
  string,
  { open: string; close: string } | { closed: true }
>;

export interface BusinessSettings {
  id: string;
  name: string;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  business_hours: BusinessHours;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
}

// Visão completa da tabela — usada só no painel (admin também vê inativos).
export interface AdminService extends Service {
  active: boolean;
  display_order: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  category: string | null;
}
