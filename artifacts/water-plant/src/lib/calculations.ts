import { db } from './db';
import type { BottleSize, StockSummary, CustomerLedgerEntry, DashboardSummary, NonFillingStockAlert } from './types';

const ALL_SIZES: BottleSize[] = ['500ml', '1.5L', '5L', '19L'];

export async function getStockSummary(): Promise<StockSummary[]> {
  const [emptyEntries, fillingRecords, invoices, productReturns, products] = await Promise.all([
    db.emptyStockEntries.toArray(),
    db.fillingRecords.toArray(),
    db.invoices.toArray(),
    db.productReturns.toArray(),
    db.products.toArray(),
  ]);

  // Only include water bottle products that require filling for stock tracking
  const productMap = Object.fromEntries(
    products.filter((p) => p.bottleSize && p.requiresFilling !== false).map((p) => [p.bottleSize!, p])
  );

  return ALL_SIZES.map((bottleSize) => {
    const emptyReceived = emptyEntries
      .filter((e) => e.bottleSize === bottleSize)
      .reduce((sum, e) => sum + e.quantity, 0);

    const filled = fillingRecords
      .filter((r) => r.bottleSize === bottleSize)
      .reduce((sum, r) => sum + r.quantity, 0);

    const emptyRemaining = emptyReceived - filled;

    // Only count invoice items for products that require filling
    const fillingProductIds = new Set(
      products.filter((p) => p.bottleSize === bottleSize && p.requiresFilling !== false).map((p) => p.id)
    );

    const fullSold = invoices
      .flatMap((inv) => inv.items)
      .filter((item) => item.bottleSize === bottleSize && (!item.productId || fillingProductIds.has(item.productId)))
      .reduce((sum, item) => sum + item.quantity, 0);

    const fullReturned = productReturns
      .flatMap((r) => r.items)
      .filter((item) => item.bottleSize === bottleSize)
      .reduce((sum, item) => sum + item.quantity, 0);

    const fullRemaining = filled - fullSold + fullReturned;
    const prod = productMap[bottleSize];

    return {
      bottleSize,
      emptyReceived,
      filled,
      emptyRemaining: Math.max(0, emptyRemaining),
      fullSold,
      fullReturned,
      fullRemaining: Math.max(0, fullRemaining),
      labelsPerUnit: prod?.labelsPerUnit ?? 1,
      capsPerUnit: prod?.capsPerUnit ?? 0,
    };
  });
}

// Returns outstanding balance for a customer (credit not yet paid)
export async function getCustomerBalance(customerId: number): Promise<number> {
  const [invoices, payments, productReturns] = await Promise.all([
    db.invoices.where('customerId').equals(customerId).toArray(),
    db.payments.where('customerId').equals(customerId).toArray(),
    db.productReturns.where('customerId').equals(customerId).toArray(),
  ]);

  // Credit = netAmount - paidAmount (paidAmount=0 for full credit, netAmount for cash, custom for partial)
  const totalUnpaid = invoices.reduce((sum, inv) => {
    const paid = inv.paidAmount ?? (inv.paymentType === 'cash' ? inv.netAmount : 0);
    return sum + (inv.netAmount - paid);
  }, 0);

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = productReturns.reduce((sum, r) => sum + r.totalCredit, 0);

  return Math.max(0, totalUnpaid - totalPayments - totalReturns);
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
    const paid = inv.paidAmount ?? (inv.paymentType === 'cash' ? inv.netAmount : 0);
    const credit = inv.netAmount - paid;

    let typeLabel = 'Cash';
    if (inv.paymentType === 'credit') typeLabel = 'Credit';
    else if (inv.paymentType === 'partial') typeLabel = `Partial — Cash Rs.${paid.toLocaleString()}`;

    entries.push({
      date: inv.date,
      type: 'invoice',
      description: `Invoice #${inv.invoiceNumber} (${typeLabel})`,
      debit: credit,  // only unpaid portion is debit
      credit: 0,
      balance: 0,
      refId: inv.id,
    });
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
      description: r.notes ? `Return - ${r.notes}` : 'Product Return',
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
    entry.balance = Math.max(0, runningBalance);
  });

  return entries;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date().toISOString().slice(0, 10);

  const [todayInvoices, todayExpenses, todayPayments, allInvoices, allPayments, allReturns, stock, nonFillingProducts, productStockEntries] =
    await Promise.all([
      db.invoices.where('date').equals(today).toArray(),
      db.expenses.where('date').equals(today).toArray(),
      db.payments.where('date').equals(today).toArray(),
      db.invoices.toArray(),
      db.payments.toArray(),
      db.productReturns.toArray(),
      getStockSummary(),
      db.products.filter((p) => p.isActive && !p.requiresFilling).toArray(),
      db.productStockEntries.toArray(),
    ]);

  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);

  // Cash = fully paid invoices + partial paid amounts
  const todayCash = todayInvoices.reduce((sum, inv) => {
    const paid = inv.paidAmount ?? (inv.paymentType === 'cash' ? inv.netAmount : 0);
    return sum + paid;
  }, 0);

  // Credit = unpaid portions
  const todayCredit = todayInvoices.reduce((sum, inv) => {
    const paid = inv.paidAmount ?? (inv.paymentType === 'cash' ? inv.netAmount : 0);
    return sum + (inv.netAmount - paid);
  }, 0);

  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayPaymentsReceived = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  // Total receivable = all unpaid amounts - payments received - return credits
  const totalUnpaid = allInvoices.reduce((sum, inv) => {
    const paid = inv.paidAmount ?? (inv.paymentType === 'cash' ? inv.netAmount : 0);
    return sum + (inv.netAmount - paid);
  }, 0);
  const totalPaymentsReceived = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = allReturns.reduce((sum, r) => sum + r.totalCredit, 0);
  const totalReceivable = Math.max(0, totalUnpaid - totalPaymentsReceived - totalReturns);

  const stockAlerts = stock.filter((s) => s.fullRemaining < 10 || s.emptyRemaining < 10);

  // Non-filling product stock alerts
  const nonFillingStockAlerts: NonFillingStockAlert[] = nonFillingProducts
    .map((p) => {
      const stockIn = productStockEntries
        .filter((e) => e.productId === p.id)
        .reduce((s, e) => s + e.quantity, 0);
      const sold = allInvoices.reduce((sum, inv) => {
        return sum + (inv.items || [])
          .filter((item) => item.productId === p.id)
          .reduce((s, item) => s + item.quantity, 0);
      }, 0);
      const balance = Math.max(0, stockIn - sold);
      return { productId: p.id!, productName: p.name, balance };
    })
    .filter((a) => a.balance < 10);

  return {
    todaySales,
    todayCash,
    todayCredit,
    todayExpenses: todayExpensesTotal,
    todayPaymentsReceived,
    totalReceivable,
    stockAlerts,
    nonFillingStockAlerts,
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
  if (discountType === 'flat') discountAmount = discountValue;
  else if (discountType === 'percent') discountAmount = (subtotal * discountValue) / 100;
  const netAmount = Math.max(0, subtotal - discountAmount - returnAdjustment);
  return { subtotal, discountAmount, netAmount };
}
