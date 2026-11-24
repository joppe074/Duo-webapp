import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate, type SimulationInput } from '../src/simulation.ts';

const base: SimulationInput = { startMonth: '2026-01', openingDebt: 10000, annualRate: 2, months: 12 };
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

test('effective annual interest: 10,000 becomes 10,200', () => {
  const result = simulate(base);
  close(result.closingDebt, 10200);
  close(result.totalInterest, 200);
});
test('new borrowing earns interest only from the following month', () => {
  const result = simulate({ ...base, openingDebt: 0, monthlyBorrowing: 500, lastBorrowingMonth: '2026-01', months: 2 });
  assert.equal(result.rows[0].interest, 0);
  close(result.rows[1].interest, 500 * (1.02 ** (1 / 12) - 1));
  assert.equal(result.totalBorrowed, 500);
});
test('zero interest, payment start and capped final payment', () => {
  const result = simulate({ ...base, openingDebt: 250, annualRate: 0, monthlyPayment: 100, firstPaymentMonth: '2026-02' });
  assert.equal(result.rows[0].payment, 0);
  assert.equal(result.rows[3].payment, 50);
  assert.equal(result.totalPaid, 250);
  assert.equal(result.closingDebt, 0);
  assert.equal(result.payoffMonth, '2026-04');
});
test('rate changes in the specified month', () => {
  const result = simulate({ ...base, annualRate: 0, rateChange: { month: '2026-07', annualRate: 12 } });
  assert.equal(result.rows[5].interest, 0);
  assert.ok(result.rows[6].interest > 0);
  close(result.closingDebt, 10000 * 1.12 ** 0.5);
});
test('balance identity over a long scenario crossing calendar years', () => {
  const result = simulate({ ...base, months: 420, monthlyBorrowing: 300, lastBorrowingMonth: '2027-06', monthlyPayment: 80, firstPaymentMonth: '2028-01', rateChange: { month: '2031-01', annualRate: 4 } });
  close(result.closingDebt, base.openingDebt + result.totalBorrowed + result.totalInterest - result.totalPaid);
  assert.equal(result.rows[12].month, '2027-01');
});
test('payoff is not reported while future borrowing remains', () => {
  const result = simulate({ ...base, openingDebt: 0, monthlyBorrowing: 100, lastBorrowingMonth: '2027-01', monthlyPayment: 200, firstPaymentMonth: '2026-01' });
  assert.equal(result.payoffMonth, null);
});
test('insufficient payments allow debt growth', () => {
  const result = simulate({ ...base, monthlyPayment: 1, firstPaymentMonth: '2026-01' });
  assert.ok(result.closingDebt > base.openingDebt);
  assert.equal(result.payoffMonth, null);
});
test('invalid numbers, dates and missing schedules are rejected', () => {
  for (const patch of [{ openingDebt: -1 }, { annualRate: NaN }, { monthlyPayment: Infinity }, { startMonth: '2026-13' }, { months: 1.5 }, { months: 0 }, { monthlyBorrowing: 20 }, { monthlyPayment: 20 }]) {
    assert.throws(() => simulate({ ...base, ...patch }));
  }
});
