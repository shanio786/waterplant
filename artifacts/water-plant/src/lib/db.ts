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
  ProductStockEntry,
} from './types';
import { hashPassword } from './auth';

const DEFAULT_PRODUCTS = [
  { name: '500 ml Bottle', unit: '500ml', sellingPrice: 30, costPrice: 15, labelsPerUnit: 1, capsPerUnit: 1, category: 'water_bottle' as const, bottleSize: '500ml' as const, requiresFilling: true, isDefault: true, isActive: true },
  { name: '1.5 Liter Bottle', unit: '1.5L', sellingPrice: 60, costPrice: 30, labelsPerUnit: 1, capsPerUnit: 1, category: 'water_bottle' as const, bottleSize: '1.5L' as const, requiresFilling: true, isDefault: true, isActive: true },
  { name: '5 Liter Bottle', unit: '5L', sellingPrice: 100, costPrice: 50, labelsPerUnit: 1, capsPerUnit: 1, category: 'water_bottle' as const, bottleSize: '5L' as const, requiresFilling: true, isDefault: true, isActive: true },
  { name: '19 Liter Can', unit: '19L', sellingPrice: 150, costPrice: 80, labelsPerUnit: 0, capsPerUnit: 0, category: 'water_bottle' as const, bottleSize: '19L' as const, requiresFilling: true, isDefault: true, isActive: true },
];

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
  productStockEntries!: Table<ProductStockEntry, number>;

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
          await tx.table('products').bulkAdd(DEFAULT_PRODUCTS.map((p) => ({ ...p, createdAt: now })));
        }
        const userCount = await tx.table('users').count();
        if (userCount === 0) {
          const devHash = await hashPassword('dev123');
          await tx.table('users').add({ username: 'dev', passwordHash: devHash, role: 'dev', name: 'Developer', createdAt: now });
        }
        const settingsCount = await tx.table('businessSettings').count();
        if (settingsCount === 0) {
          await tx.table('businessSettings').add({ companyName: 'Water Plant', phone: '', address: '', city: '', footerNote: 'Thank you for your business!', updatedAt: now });
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

    // Version 4: add requiresFilling to products, paidAmount to invoices
    this.version(4)
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
        consumableStock: '++id, item, bottleSize, date, createdAt',
      })
      .upgrade(async (tx) => {
        // Set requiresFilling = true on all existing water_bottle products, false for others
        await tx.table('products').toCollection().modify((p: any) => {
          if (p.requiresFilling === undefined) {
            p.requiresFilling = p.category === 'water_bottle';
          }
          // Fix 19L can: no caps needed (caps are tracked differently)
          if (p.bottleSize === '19L') {
            p.capsPerUnit = 0;
          }
        });
        // Set paidAmount = netAmount on existing invoices (backward compat)
        await tx.table('invoices').toCollection().modify((inv: any) => {
          if (inv.paidAmount === undefined) {
            inv.paidAmount = inv.paymentType === 'credit' ? 0 : inv.netAmount;
          }
        });
      });

    // Version 5: non-filling product stock entries
    this.version(5).stores({
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
      productStockEntries: '++id, productId, date, createdAt',
    });

    // Version 6: per-product filling tracking (productId added to fillingRecords)
    this.version(6).stores({
      customers: '++id, name, phone, createdAt',
      emptyStockEntries: '++id, bottleSize, date, createdAt',
      fillingRecords: '++id, bottleSize, productId, date, createdAt',
      invoices: '++id, invoiceNumber, customerId, date, paymentType, createdAt',
      payments: '++id, customerId, date, createdAt',
      productReturns: '++id, customerId, invoiceId, date, createdAt',
      canReturns: '++id, customerId, date, createdAt',
      expenses: '++id, category, date, createdAt',
      products: '++id, name, category, isActive',
      users: '++id, username, role',
      businessSettings: '++id',
      consumableStock: '++id, item, bottleSize, date, createdAt',
      productStockEntries: '++id, productId, date, createdAt',
    });

    this.on('populate', async () => {
      const now = new Date().toISOString();
      const devHash = await hashPassword('dev123');

      await this.users.add({ username: 'dev', passwordHash: devHash, role: 'dev', name: 'Developer', createdAt: now });
      await this.businessSettings.add({ companyName: 'Water Plant', phone: '', address: '', city: '', footerNote: 'Thank you for your business!', updatedAt: now });
      await this.products.bulkAdd(DEFAULT_PRODUCTS.map((p) => ({ ...p, createdAt: now })));
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
