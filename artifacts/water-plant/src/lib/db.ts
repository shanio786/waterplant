import Dexie, { Table } from 'dexie';
import type {
  Customer,
  EmptyStockEntry,
  FillingRecord,
  Invoice,
  Payment,
  ProductReturn,
  CanReturn,
  Expense,
} from './types';

export class WaterPlantDB extends Dexie {
  customers!: Table<Customer, number>;
  emptyStockEntries!: Table<EmptyStockEntry, number>;
  fillingRecords!: Table<FillingRecord, number>;
  invoices!: Table<Invoice, number>;
  payments!: Table<Payment, number>;
  productReturns!: Table<ProductReturn, number>;
  canReturns!: Table<CanReturn, number>;
  expenses!: Table<Expense, number>;

  constructor() {
    super('WaterPlantDB');
    this.version(1).stores({
      customers: '++id, name, phone, createdAt',
      emptyStockEntries: '++id, bottleSize, date, createdAt',
      fillingRecords: '++id, bottleSize, date, createdAt',
      invoices: '++id, invoiceNumber, customerId, date, paymentType, createdAt',
      payments: '++id, customerId, date, createdAt',
      productReturns: '++id, customerId, invoiceId, date, createdAt',
      canReturns: '++id, customerId, date, createdAt',
      expenses: '++id, category, date, createdAt',
    });
  }
}

export const db = new WaterPlantDB();

export async function generateInvoiceNumber(): Promise<string> {
  const count = await db.invoices.count();
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, '0');
  return `INV-${year}-${num}`;
}
