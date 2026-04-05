import { db } from './db';
import type {
  BottleSize,
  BOTTLE_SIZES,
  StockSummary,
  CustomerLedgerEntry,
  DashboardSummary,
} from './types';

const ALL_SIZES: BottleSize[] = ['500ml', '1.5L', '5L', '19L'];

export async function getStockSummary(): Promise<StockSummary[]> {
  const [emptyEntries, fillingRecords, invoices, productReturns] = await Promise.all([
    db.emptyStockEntries.toArray(),
    db.fillingRecords.toArray(),
    db.invoices.toArray(),
    db.productReturns.toArray(),
  ]);

  return ALL_SIZES.map((bottleSize) => {
    const emptyReceived = emptyEntries
      .filter((e) => e.bottleSize === bottleSize)
      .reduce((sum, e) => sum + e.quantity, 0);

    const filled = fillingRecords
      .filter((r) => r.bottleSize === bottleSize)
      .reduce((sum, r) => sum + r.quantity, 0);

    const emptyRemaining = emptyReceived - filled;

    const fullSold = invoices.flatMap((inv) => inv.items).filter((item) => item.bottleSize === bottleSize).reduce((sum, item) => sum + item.quantity, 0);

    const fullReturned = productReturns
      .flatMap((r) => r.items)
      .filter((item) => item.bottleSize === bottleSize)
      .reduce((sum, item) => sum + item.quantity, 0);

    const fullRemaining = filled - fullSold + fullReturned;

    return {
      bottleSize,
      emptyReceived,
      filled,
      emptyRemaining: Math.max(0, emptyRemaining),
      fullSold,
      fullReturned,
      fullRemaining: Math.max(0, fullRemaining),
    };
  });
}

export async function getCustomerBalance(customerId: number): Promise<number> {
  const [invoices, payments, productReturns] = await Promise.all([
    db.invoices.where('customerId').equals(customerId).toArray(),
    db.payments.where('customerId').equals(customerId).toArray(),
    db.productReturns.where('customerId').equals(customerId).toArray(),
  ]);

  const creditSales = invoices
    .filter((inv) => inv.paymentType === 'credit')
    .reduce((sum, inv) => sum + inv.netAmount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = productReturns.reduce((sum, r) => sum + r.totalCredit, 0);

  return Math.max(0, creditSales - totalPayments - totalReturns);
}

export async function getCustomer19LBalance(customerId: number): Promise<number> {
  const [invoices, canReturns] = await Promise.all([
    db.invoices.where('customerId').equals(customerId).toArray(),
    db.canReturns.where('customerId').equals(customerId).toArray(),
  ]);

  const sold19L = invoices
    .flatMap((inv) => inv.items)
    .filter((item) => item.bottleSize === '19L')
    .reduce((sum, item) => sum + item.quantity, 0);

  const returned19L = canReturns.reduce((sum, r) => sum + r.quantity, 0);

  return Math.max(0, sold19L - returned19L);
}

export async function getCustomerLedger(customerId: number): Promise<CustomerLedgerEntry[]> {
  const [invoices, payments, productReturns, canReturns] = await Promise.all([
    db.invoices.where('customerId').equals(customerId).toArray(),
    db.payments.where('customerId').equals(customerId).toArray(),
    db.productReturns.where('customerId').equals(customerId).toArray(),
    db.canReturns.where('customerId').equals(customerId).toArray(),
  ]);

  const entries: CustomerLedgerEntry[] = [];

  invoices.forEach((inv) => {
    if (inv.paymentType === 'credit') {
      entries.push({
        date: inv.date,
        type: 'invoice',
        description: `Invoice #${inv.invoiceNumber} (Credit)`,
        debit: inv.netAmount,
        credit: 0,
        balance: 0,
        refId: inv.id,
      });
    } else {
      entries.push({
        date: inv.date,
        type: 'invoice',
        description: `Invoice #${inv.invoiceNumber} (Cash - Settled)`,
        debit: 0,
        credit: 0,
        balance: 0,
        refId: inv.id,
      });
    }
  });

  payments.forEach((p) => {
    entries.push({
      date: p.date,
      type: 'payment',
      description: p.notes ? `Payment - ${p.notes}` : 'Payment received',
      debit: 0,
      credit: p.amount,
      balance: 0,
      refId: p.id,
    });
  });

  productReturns.forEach((r) => {
    entries.push({
      date: r.date,
      type: 'return',
      description: r.notes ? `Product Return - ${r.notes}` : 'Product Return',
      debit: 0,
      credit: r.totalCredit,
      balance: 0,
      refId: r.id,
    });
  });

  canReturns.forEach((r) => {
    entries.push({
      date: r.date,
      type: 'can_return',
      description: `19L Can Return (${r.quantity} cans)`,
      debit: 0,
      credit: 0,
      balance: 0,
      refId: r.id,
    });
  });

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  entries.forEach((entry) => {
    runningBalance += entry.debit - entry.credit;
    entry.balance = runningBalance;
  });

  return entries;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date().toISOString().slice(0, 10);

  const [todayInvoices, todayExpenses, todayPayments, allInvoices, allPayments, allReturns, stock] =
    await Promise.all([
      db.invoices.where('date').equals(today).toArray(),
      db.expenses.where('date').equals(today).toArray(),
      db.payments.where('date').equals(today).toArray(),
      db.invoices.toArray(),
      db.payments.toArray(),
      db.productReturns.toArray(),
      getStockSummary(),
    ]);

  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
  const todayCash = todayInvoices.filter((inv) => inv.paymentType === 'cash').reduce((sum, inv) => sum + inv.netAmount, 0);
  const todayCredit = todayInvoices.filter((inv) => inv.paymentType === 'credit').reduce((sum, inv) => sum + inv.netAmount, 0);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayPaymentsReceived = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalCreditSales = allInvoices
    .filter((inv) => inv.paymentType === 'credit')
    .reduce((sum, inv) => sum + inv.netAmount, 0);
  const totalPaymentsReceived = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = allReturns.reduce((sum, r) => sum + r.totalCredit, 0);
  const totalReceivable = Math.max(0, totalCreditSales - totalPaymentsReceived - totalReturns);

  const stockAlerts = stock.filter((s) => s.fullRemaining < 10 || s.emptyRemaining < 10);

  return {
    todaySales,
    todayCash,
    todayCredit,
    todayExpenses: todayExpensesTotal,
    todayPaymentsReceived,
    totalReceivable,
    stockAlerts,
  };
}

export function calculateInvoiceAmounts(
  items: Array<{ quantity: number; rate: number }>,
  discountType: 'flat' | 'percent',
  discountValue: number,
  returnAdjustment: number
): { subtotal: number; discountAmount: number; netAmount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  let discountAmount = 0;
  if (discountType === 'flat') {
    discountAmount = discountValue;
  } else if (discountType === 'percent') {
    discountAmount = (subtotal * discountValue) / 100;
  }
  const netAmount = Math.max(0, subtotal - discountAmount - returnAdjustment);
  return { subtotal, discountAmount, netAmount };
}
