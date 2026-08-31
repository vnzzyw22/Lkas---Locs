const TIMEZONE = "America/Sao_Paulo";

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(
    new Date(),
  );
}

export function currentMonthISO() {
  return todayISO().slice(0, 7);
}
