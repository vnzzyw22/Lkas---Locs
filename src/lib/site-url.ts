// URL pública do site, derivada do ambiente (não hardcoded) — mesmo espírito
// do hostname do Supabase em next.config.ts, importante pro modelo de
// reuso/template clonado. VERCEL_URL é injetada automaticamente pela Vercel
// (sem precisar configurar nada); NEXT_PUBLIC_SITE_URL é o jeito de apontar
// pra um domínio próprio quando ele existir, sem mudar código.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
