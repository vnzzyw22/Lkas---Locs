"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/supabase/types";

interface ServiceSelectProps {
  services: Service[];
  value: string;
  onChange: (id: string) => void;
  buttonId: string;
  labelId: string;
  listboxId: string;
}

function serviceLabel(service: Service) {
  return `${service.name} — ${formatPrice(service.price)} (${formatDuration(service.duration_minutes)})`;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 6"
      className={`h-1.5 w-2.5 shrink-0 fill-none stroke-current transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
}

// Dropdown 100% customizado (2026-09-03), a pedido do cliente — o <select>
// nativo herda o tema do sistema operacional/navegador (lista azul no
// Windows/Chrome), impossível de restilizar por CSS além do campo
// fechado. Reimplementado como listbox ARIA (`role="listbox"`/`"option"`,
// `aria-expanded`/`aria-selected`, navegação por seta/Enter/Escape,
// fecha ao clicar fora) pra manter acessibilidade equivalente à do
// `<select>` original sem abrir mão do controle visual total.
export function ServiceSelect({
  services,
  value,
  onChange,
  buttonId,
  labelId,
  listboxId,
}: ServiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = services.findIndex((s) => s.id === value);
  const selected = selectedIndex >= 0 ? services[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  function openMenu() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function selectAt(index: number) {
    const service = services[index];
    if (!service) return;
    onChange(service.id);
    closeMenu(true);
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeMenu(true);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(services.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectAt(activeIndex);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-[#161616] px-3 py-2.5 text-left text-sm text-white transition-colors duration-200 outline-none ${
          open ? "border-brand-red" : "border-transparent"
        }`}
      >
        <span className={selected ? "" : "text-brand-smoke"}>
          {selected ? serviceLabel(selected) : "Selecione um serviço"}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          id={listboxId}
          aria-labelledby={labelId}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-white/10 bg-[#121212]/95 py-1 shadow-xl shadow-black/50 outline-none backdrop-blur-md"
        >
          {services.map((service, i) => {
            const isSelected = service.id === value;
            const isActive = i === activeIndex;

            return (
              <li
                key={service.id}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectAt(i)}
                className={`cursor-pointer px-3 py-2.5 font-nav text-xs font-semibold tracking-wide text-white uppercase transition-colors duration-150 ${
                  isActive ? "bg-brand-red" : ""
                }`}
              >
                {serviceLabel(service)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
