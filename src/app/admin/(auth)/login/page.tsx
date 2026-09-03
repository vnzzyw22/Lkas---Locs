import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login — Lkas Locs Admin",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-brand-ink px-6">
      <h1 className="font-display text-xl font-bold text-white uppercase">
        Lkas <span className="text-brand-red">Locs</span> — Admin
      </h1>
      <LoginForm />
    </main>
  );
}
