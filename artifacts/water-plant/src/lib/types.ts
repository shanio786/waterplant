export type BottleSize = '500ml' | '1.5L' | '5L' | '19L';
export const BOTTLE_SIZES: BottleSize[] = ['500ml', '1.5L', '5L', '19L'];
export const BOTTLE_LABELS: Record<BottleSize, string> = {
  '500ml': '500 ml',
  '1.5L': '1.5 Liter',
  '5L': '5 Liter',
  '19L': '19 Liter (Can)',
};

export type PaymentType = 'cash' | 'credit' | 'partial';
export type DiscountType = 'flat' | 'percent';
export type UserRole = 'dev' | 'admin' | 'store_manager';
export type ProductCategory = 'water_bottle' | 'beverage' | 'other';

export type ExpenseCategory =
  | 'Salary'
  | 'Rent'
  | 'Electricity'
  | 'Fuel'
  | 'Maintenance'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Salary', 'Rent', 'Electricity', 'Fuel', 'Maintenance', 'Other',
];

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'water_bottle', label: 'Water Bottle' },
  { value: 'beverage', label: 'Beverage / Juice' },
  { value: 'other', label: 'Other' },
];

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'dev', label: 'Developer (Super Admin)' },
  { value: 'admin', label: 'Admin' },
  { value: 'store_manager', label: 'Store Manager' },
];

export interface Product {
  id?: number;
  name: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  labelsPerUnit: number;
  capsPerUnit: number;
  category: ProductCategory;
  bottleSize?: BottleSize;
  requiresFilling: boolean;
  isDefault: boolean;
  isActive: boolean;
  packSize?: number;
  packSellingPrice?: number;
  createdAt: string;
}

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface BusinessSettings {
  id?: number;
  companyName: string;
  phone: string;
  address: string;
  city: string;
  footerNote: string;
  updatedAt: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface EmptyStockEntry {
  id?: number;
  productId?: number;
  bottleSize: BottleSize;
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface FillingRecord {
  id?: number;
  productId?: number;
  bottleSize: BottleSize;
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId?: number;
  productName: string;
  bottleSize?: BottleSize;
  quantity: number;
  rate: number;
  costPrice: number;
  amount: number;
  packCount?: number;
  packSize?: number;
  packRate?: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  customerId: number;
  date: string;
  items: InvoiceItem[];
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  returnAdjustment: number;
  returnNote: string;
  subtotal: number;
  netAmount: number;
  paidAmount: number;
  paymentType: PaymentType;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id?: number;
  customerId: number;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface ProductReturn {
  id?: number;
  customerId: number;
  invoiceId?: number;
  date: string;
  items: Array<{
    productId?: number;
    productName: string;
    bottleSize?: BottleSize;
    quantity: number;
    rate: number;
    credit: number;
  }>;
  totalCredit: number;
  notes?: string;
  createdAt: string;
}

export interface CanReturn {
  id?: number;
  customerId: number;
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id?: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface StockSummary {
  bottleSize: BottleSize;
  emptyReceived: number;
  filled: number;
  emptyRemaining: number;
  fullSold: number;
  fullReturned: number;
  fullRemaining: number;
  labelsPerUnit: number;
  capsPerUnit: number;
}

export interface CustomerLedgerEntry {
  date: string;
  type: 'invoice' | 'payment' | 'return' | 'can_return';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  refId?: number;
}

export interface NonFillingStockAlert {
  productId: number;
  productName: string;
  balance: number;
}

export interface DashboardSummary {
  todaySales: number;
  todayCash: number;
  todayCredit: number;
  todayExpenses: number;
  todayPaymentsReceived: number;
  totalReceivable: number;
  stockAlerts: StockSummary[];
  nonFillingStockAlerts: NonFillingStockAlert[];
}

export type ConsumableItem = 'label' | 'cap';

export interface ConsumableStock {
  id?: number;
  productId?: number;
  item: ConsumableItem;
  bottleSize: BottleSize;
  quantity: number;
  date: string;
  notes?: string;
  createdAt: string;
}

// Stock entry for non-filling products (juice, drinks etc. purchased externally)
export interface ProductStockEntry {
  id?: number;
  productId: number;
  quantity: number;
  costPrice: number;
  date: string;
  notes?: string;
  createdAt: string;
}
