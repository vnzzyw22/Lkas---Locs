"use client";

import { useState } from "react";
import { updateBusinessSettings } from "@/app/admin/(painel)/configuracoes/actions";
import {
  buttonPrimaryClass,
  fieldClass,
  labelClass,
  sectionTitleClass,
} from "@/components/admin/theme";
import {
  HoursEditor,
  toBusinessHours,
  toHoursState,
  type HoursState,
} from "@/components/admin/hours-editor";
import type { BusinessSettings } from "@/lib/supabase/types";

interface SettingsFormProps {
  business: BusinessSettings;
}

export function SettingsForm({ business }: SettingsFormProps) {
  const [name, setName] = useState(business.name);
  const [whatsapp, setWhatsapp] = useState(business.whatsapp ?? "");
  const [instagram, setInstagram] = useState(business.instagram ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [depositAmount, setDepositAmount] = useState(
    business.deposit_amount > 0
      ? business.deposit_amount.toFixed(2).replace(".", ",")
      : "",
  );
  const [pixKey, setPixKey] = useState(business.pix_key ?? "");
  const [holdMinutes, setHoldMinutes] = useState(
    String(business.deposit_hold_minutes),
  );
  const [hours, setHours] = useState<HoursState>(
    toHoursState(business.business_hours),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleHoursChange(next: HoursState) {
    setHours(next);
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const result = await updateBusinessSettings({
      name,
      whatsapp,
      instagram,
      address,
      depositAmount,
      pixKey,
      depositHoldMinutes: holdMinutes,
      businessHours: toBusinessHours(hours),
    });

    setSubmitting(false);

    if (result.ok) {
      setSaved(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={labelClass}>
          Nome do negócio
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="whatsapp" className={labelClass}>
          WhatsApp (com DDI e DDD, ex: 5544999999999)
        </label>
        <input
          id="whatsapp"
          type="text"
          placeholder="5544999999999"
          value={whatsapp}
          onChange={(e) => {
            setWhatsapp(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="instagram" className={labelClass}>
          Instagram (@usuário)
        </label>
        <input
          id="instagram"
          type="text"
          placeholder="@lkaslocs"
          value={instagram}
          onChange={(e) => {
            setInstagram(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="address" className={labelClass}>
          Endereço
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <span className={sectionTitleClass}>Sinal via Pix</span>
          <p className="mt-1 text-xs text-white/50">
            O cliente paga o sinal na chave abaixo e manda o comprovante pelo
            WhatsApp; você confirma em Pagamentos. Deixe o valor vazio para
            desligar o sinal (o agendamento volta a ser só pendente até você
            confirmar).
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="deposit" className={labelClass}>
            Valor do sinal (R$)
          </label>
          <input
            id="deposit"
            type="text"
            inputMode="decimal"
            placeholder="30,00"
            value={depositAmount}
            onChange={(e) => {
              setDepositAmount(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="pixKey" className={labelClass}>
            Chave Pix (aparece para o cliente)
          </label>
          <input
            id="pixKey"
            type="text"
            autoComplete="off"
            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            value={pixKey}
            onChange={(e) => {
              setPixKey(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="holdMinutes" className={labelClass}>
            Tempo da reserva enquanto o cliente paga (minutos)
          </label>
          <input
            id="holdMinutes"
            type="number"
            min={5}
            max={240}
            value={holdMinutes}
            onChange={(e) => {
              setHoldMinutes(e.target.value);
              setSaved(false);
            }}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className={sectionTitleClass}>Horário de funcionamento</span>

        <HoursEditor hours={hours} onChange={handleHoursChange} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Configurações salvas.</p>}

      <button
        type="submit"
        disabled={submitting}
        className={`self-start ${buttonPrimaryClass}`}
      >
        {submitting ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
