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
  Product,
  User,
  BusinessSettings,
  ConsumableStock,
} from './types';

async function hashPwd(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class WaterPlantDB extends Dexie {
  customers!: Table<Customer, number>;
  emptyStockEntries!: Table<EmptyStockEntry, number>;
  fillingRecords!: Table<FillingRecord, number>;
  invoices!: Table<Invoice, number>;
  payments!: Table<Payment, number>;
  productReturns!: Table<ProductReturn, number>;
  canReturns!: Table<CanReturn, number>;
  expenses!: Table<Expense, number>;
  products!: Table<Product, number>;
  users!: Table<User, number>;
  businessSettings!: Table<BusinessSettings, number>;
  consumableStock!: Table<ConsumableStock, number>;

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

    this.version(2)
      .stores({
        customers: '++id, name, phone, createdAt',
        emptyStockEntries: '++id, bottleSize, date, createdAt',
        fillingRecords: '++id, bottleSize, date, createdAt',
        invoices: '++id, invoiceNumber, customerId, date, paymentType, createdAt',
        payments: '++id, customerId, date, createdAt',
        productReturns: '++id, customerId, invoiceId, date, createdAt',
        canReturns: '++id, customerId, date, createdAt',
        expenses: '++id, category, date, createdAt',
        products: '++id, name, category, isActive',
        users: '++id, username, role',
        businessSettings: '++id',
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();

        const productCount = await tx.table('products').count();
        if (productCount === 0) {
          await tx.table('products').bulkAdd([
            {
              name: '500 ml Bottle',
              unit: '500ml',
              sellingPrice: 30,
              costPrice: 15,
              labelsPerUnit: 1,
              capsPerUnit: 1,
              category: 'water_bottle',
              bottleSize: '500ml',
              isDefault: true,
              isActive: true,
              createdAt: now,
            },
            {
              name: '1.5 Liter Bottle',
              unit: '1.5L',
              sellingPrice: 60,
              costPrice: 30,
              labelsPerUnit: 1,
              capsPerUnit: 1,
              category: 'water_bottle',
              bottleSize: '1.5L',
              isDefault: true,
              isActive: true,
              createdAt: now,
            },
            {
              name: '5 Liter Bottle',
              unit: '5L',
              sellingPrice: 100,
              costPrice: 50,
              labelsPerUnit: 1,
              capsPerUnit: 1,
              category: 'water_bottle',
              bottleSize: '5L',
              isDefault: true,
              isActive: true,
              createdAt: now,
            },
            {
              name: '19 Liter Can',
              unit: '19L',
              sellingPrice: 150,
              costPrice: 80,
              labelsPerUnit: 0,
              capsPerUnit: 1,
              category: 'water_bottle',
              bottleSize: '19L',
              isDefault: true,
              isActive: true,
              createdAt: now,
            },
          ]);
        }

        const userCount = await tx.table('users').count();
        if (userCount === 0) {
          const hash = await hashPwd('dev123');
          await tx.table('users').add({
            username: 'dev',
            passwordHash: hash,
            role: 'dev',
            name: 'Developer',
            createdAt: now,
          });
        }

        const settingsCount = await tx.table('businessSettings').count();
        if (settingsCount === 0) {
          await tx.table('businessSettings').add({
            companyName: 'Water Plant',
            phone: '',
            address: '',
            city: '',
            footerNote: 'Thank you for your business!',
            updatedAt: now,
          });
        }
      });

    this.version(3).stores({
      customers: '++id, name, phone, createdAt',
      emptyStockEntries: '++id, bottleSize, date, createdAt',
      fillingRecords: '++id, bottleSize, date, createdAt',
      invoices: '++id, invoiceNumber, customerId, date, paymentType, createdAt',
      payments: '++id, customerId, date, createdAt',
      productReturns: '++id, customerId, invoiceId, date, createdAt',
      canReturns: '++id, customerId, date, createdAt',
      expenses: '++id, category, date, createdAt',
      products: '++id, name, category, isActive',
      users: '++id, username, role',
      businessSettings: '++id',
      consumableStock: '++id, item, bottleSize, date, createdAt',
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
