export interface SimulationInput {
  startMonth: string;
  openingDebt: number;
  annualRate: number;
  months: number;
  monthlyBorrowing?: number;
  lastBorrowingMonth?: string;
  monthlyPayment?: number;
  firstPaymentMonth?: string;
  rateChange?: { month: string; annualRate: number };
}

export interface MonthResult {
  month: string;
  openingDebt: number;
  annualRate: number;
  interest: number;
  borrowing: number;
  payment: number;
  closingDebt: number;
}

function monthIndex(value: string): number {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new Error('Gebruik een maand in de vorm JJJJ-MM.');
  }
  const [year, month] = value.split('-').map(Number);
  if (year < 1) throw new Error('Het jaartal moet positief zijn.');
  return year * 12 + month - 1;
}

function monthLabel(index: number): string {
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}`;
}

function nonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} moet een eindig, niet-negatief getal zijn.`);
  }
}

/** Monthly educational model; payments occur at month end. No DUO entitlement rules. */
export function simulate(input: SimulationInput) {
  const start = monthIndex(input.startMonth);
  nonNegative(input.openingDebt, 'Schuld');
  nonNegative(input.annualRate, 'Rente');
  const borrowing = input.monthlyBorrowing ?? 0;
  const payment = input.monthlyPayment ?? 0;
  nonNegative(borrowing, 'Leenbedrag');
  nonNegative(payment, 'Terugbetaling');
  if (!Number.isInteger(input.months) || input.months < 1 || input.months > 1200) {
    throw new Error('Kies een simulatieduur van 1 tot en met 1200 maanden.');
  }
  if (start + input.months - 1 >= 10000 * 12) throw new Error('Einddatum valt buiten het ondersteunde bereik.');
  if (borrowing > 0 && !input.lastBorrowingMonth) throw new Error('Vul de laatste leenmaand in.');
  if (payment > 0 && !input.firstPaymentMonth) throw new Error('Vul de eerste betaalmaand in.');
  const lastBorrowing = input.lastBorrowingMonth ? monthIndex(input.lastBorrowingMonth) : -Infinity;
  const firstPayment = input.firstPaymentMonth ? monthIndex(input.firstPaymentMonth) : Infinity;
  const change = input.rateChange ? monthIndex(input.rateChange.month) : Infinity;
  if (input.rateChange) nonNegative(input.rateChange.annualRate, 'Scenariorente');
  let debt = input.openingDebt;
  let totalInterest = 0;
  let totalBorrowed = 0;
  let totalPaid = 0;
  let payoffMonth: string | null = null;
  const rows: MonthResult[] = [];
  for (let offset = 0; offset < input.months; offset++) {
    const index = start + offset;
    const rate = index >= change ? input.rateChange!.annualRate : input.annualRate;
    const interest = debt * Math.expm1(Math.log1p(rate / 100) / 12);
    const added = index <= lastBorrowing ? borrowing : 0;
    const available = debt + interest + added;
    if (!Number.isFinite(available)) throw new Error('De berekening overschrijdt het ondersteunde getalbereik.');
    const paid = index >= firstPayment ? Math.min(payment, available) : 0;
    const closing = available - paid;
    const month = monthLabel(index);
    rows.push({ month, openingDebt: debt, annualRate: rate, interest, borrowing: added, payment: paid, closingDebt: closing });
    if (available > 0 && closing === 0 && (borrowing === 0 || index >= lastBorrowing)) payoffMonth = month;
    totalInterest += interest;
    totalBorrowed += added;
    totalPaid += paid;
    debt = closing;
  }
  return { rows, closingDebt: debt, totalInterest, totalBorrowed, totalPaid, payoffMonth };
}
