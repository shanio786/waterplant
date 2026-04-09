import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { getStockSummary, getCustomerBalance } from "@/lib/calculations";
import type { StockSummary, BottleSize } from "@/lib/types";
import { BOTTLE_LABELS, BOTTLE_SIZES, EXPENSE_CATEGORIES } from "@/lib/types";
import { Users, Package, Printer, TrendingUp, Receipt, RotateCcw, Wallet, BookOpen } from "lucide-react";
import { format } from "date-fns";

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

function DailyReport() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const invoices = useLiveQuery(() => db.invoices.where("date").equals(date).toArray(), [date]);
  const expenses = useLiveQuery(() => db.expenses.where("date").equals(date).toArray(), [date]);
  const payments = useLiveQuery(() => db.payments.where("date").equals(date).toArray(), [date]);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const allInvoices = useLiveQuery(() => db.invoices.toArray(), []);
  const allPayments = useLiveQuery(() => db.payments.toArray(), []);
  const allReturns = useLiveQuery(() => db.productReturns.toArray(), []);
  const [pendingBalances, setPendingBalances] = useState<Record<number, number>>({});

  const totalSales = (invoices || []).reduce((s, i) => s + i.netAmount, 0);
  // Cash = actually paid amounts (cash + partial paid portion)
  const cashSales = (invoices || []).reduce((s, i) => {
    const paid = i.paidAmount ?? (i.paymentType === "cash" ? i.netAmount : 0);
    return s + paid;
  }, 0);
  // Credit = unpaid portions
  const creditSales = (invoices || []).reduce((s, i) => {
    const paid = i.paidAmount ?? (i.paymentType === "cash" ? i.netAmount : 0);
    return s + (i.netAmount - paid);
  }, 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const totalPayments = (payments || []).reduce((s, p) => s + p.amount, 0);

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  useEffect(() => {
    if (!customers || !allInvoices || !allPayments || !allReturns) return;
    const balMap: Record<number, number> = {};
    customers.forEach((c) => {
      // Total unpaid = sum of (netAmount - paidAmount) for each invoice
      const totalUnpaid = (allInvoices || [])
        .filter((inv) => inv.customerId === c.id!)
        .reduce((s, inv) => {
          const paidAmt = inv.paidAmount ?? (inv.paymentType === "cash" ? inv.netAmount : 0);
          return s + (inv.netAmount - paidAmt);
        }, 0);
      const paid = (allPayments || []).filter((p) => p.customerId === c.id!).reduce((s, p) => s + p.amount, 0);
      const returned = (allReturns || []).filter((r) => r.customerId === c.id!).reduce((s, r) => s + r.totalCredit, 0);
      balMap[c.id!] = Math.max(0, totalUnpaid - paid - returned);
    });
    setPendingBalances(balMap);
  }, [customers, allInvoices, allPayments, allReturns]);

  const pendingCustomers = (customers || []).filter((c) => (pendingBalances[c.id!] || 0) > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <Label className="text-xs">Select Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" data-testid="input-report-date" />
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="mt-5 no-print" data-testid="button-print-report">
          <Printer className="h-4 w-4 mr-1.5" />
          Print
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Total Sales", value: totalSales, color: "text-primary" },
          { label: "Cash Sales", value: cashSales, color: "text-green-600" },
          { label: "Credit Sales", value: creditSales, color: "text-orange-600" },
          { label: "Payments Received", value: totalPayments, color: "text-green-600" },
          { label: "Expenses", value: totalExpenses, color: "text-destructive" },
          { label: "Net (Sales - Expenses)", value: totalSales - totalExpenses, color: totalSales - totalExpenses >= 0 ? "text-green-600" : "text-destructive" },
        ].map((item) => (
          <Card key={item.label} data-testid={`stat-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{formatPKR(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Invoices ({invoices?.length || 0})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {!invoices || invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices for this date.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2">Invoice #</th>
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2">{inv.invoiceNumber}</td>
                    <td className="py-2">{customerMap[inv.customerId]?.name || "?"}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className={`text-xs ${inv.paymentType === "cash" ? "bg-green-100 text-green-700" : inv.paymentType === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-600"}`}>
                        {inv.paymentType === "cash" ? "Cash" : inv.paymentType === "partial" ? "Partial" : "Credit"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right font-medium">{formatPKR(inv.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pending customers */}
      {pendingCustomers.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Customers with Pending Balance ({pendingCustomers.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {pendingCustomers.map((c) => (
                <div key={c.id} className="py-2 flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>
                  </div>
                  <span className="text-destructive font-medium">{formatPKR(pendingBalances[c.id!] || 0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses */}
      {expenses && expenses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Expenses ({expenses.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {expenses.map((e) => (
                <div key={e.id} className="py-2 flex justify-between text-sm">
                  <span>{e.category} — {e.description}</span>
                  <span className="text-destructive font-medium">{formatPKR(e.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProductSalesReport() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const invoices = useLiveQuery(
    () => db.invoices.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );

  type SaleRow = { qty: number; revenue: number; cost: number };
  const byProduct: Record<string, SaleRow> = {};

  (invoices || []).forEach((inv) => {
    inv.items.forEach((item) => {
      const key = item.productName || (item.bottleSize ? BOTTLE_LABELS[item.bottleSize] : "Unknown");
      if (!byProduct[key]) byProduct[key] = { qty: 0, revenue: 0, cost: 0 };
      byProduct[key].qty += item.quantity;
      byProduct[key].revenue += item.amount;
      byProduct[key].cost += item.quantity * (item.costPrice || 0);
    });
  });

  const rows = Object.entries(byProduct).sort((a, b) => b[1].revenue - a[1].revenue);
  const totalRevenue = rows.reduce((s, [, r]) => s + r.revenue, 0);
  const totalQty = rows.reduce((s, [, r]) => s + r.qty, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" data-testid="input-from-date" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" data-testid="input-to-date" />
        </div>
        <div className="text-sm font-semibold mt-5">
          {invoices?.length || 0} invoices
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left py-2.5 px-3 text-xs font-semibold">Product</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Qty</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Revenue</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Cost</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Profit</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No sales in this range</td></tr>
            ) : (
              rows.map(([name, row]) => {
                const pct = totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
                const profit = row.revenue - row.cost;
                return (
                  <tr key={name} className="border-b" data-testid={`sales-row-${name}`}>
                    <td className="py-2.5 px-3 font-medium">{name}</td>
                    <td className="py-2.5 px-3 text-right">{row.qty}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatPKR(row.revenue)}</td>
                    <td className="py-2.5 px-3 text-right text-orange-600">{formatPKR(row.cost)}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>{formatPKR(profit)}</td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">{pct}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="font-semibold border-t bg-muted/50">
                <td className="py-2.5 px-3">Total</td>
                <td className="py-2.5 px-3 text-right">{totalQty}</td>
                <td className="py-2.5 px-3 text-right text-primary">{formatPKR(totalRevenue)}</td>
                <td className="py-2.5 px-3 text-right text-orange-600">{formatPKR(rows.reduce((s, [, r]) => s + r.cost, 0))}</td>
                <td className="py-2.5 px-3 text-right text-green-600">{formatPKR(rows.reduce((s, [, r]) => s + r.revenue - r.cost, 0))}</td>
                <td className="py-2.5 px-3 text-right">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function ProfitLossReport() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const invoices = useLiveQuery(
    () => db.invoices.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );
  const expenses = useLiveQuery(
    () => db.expenses.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );

  const totalRevenue = (invoices || []).reduce((s, inv) => s + inv.netAmount, 0);
  const totalCost = (invoices || []).flatMap((inv) => inv.items).reduce((s, item) => s + item.quantity * (item.costPrice || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const marginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const expenseByCategory: Record<string, number> = {};
  (expenses || []).forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: totalRevenue, color: "text-primary" },
          { label: "Total Cost (COGS)", value: totalCost, color: "text-orange-600" },
          { label: "Gross Profit", value: grossProfit, color: grossProfit >= 0 ? "text-green-600" : "text-destructive" },
          { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "text-green-600" : "text-destructive" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{formatPKR(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium">{formatPKR(totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>
            <span className="text-orange-600 font-medium">- {formatPKR(totalCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>Gross Profit ({marginPct}% margin)</span>
            <span className={grossProfit >= 0 ? "text-green-600" : "text-destructive"}>{formatPKR(grossProfit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Operating Expenses</span>
            <span className="text-destructive font-medium">- {formatPKR(totalExpenses)}</span>
          </div>
          {Object.entries(expenseByCategory).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between text-xs text-muted-foreground pl-4">
              <span>{cat}</span>
              <span>{formatPKR(amt)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Net Profit / Loss</span>
            <span className={netProfit >= 0 ? "text-green-600" : "text-destructive"}>{formatPKR(netProfit)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StockReport() {
  const [stock, setStock] = useState<StockSummary[]>([]);
  useEffect(() => { getStockSummary().then(setStock); }, []);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left py-2.5 px-3 text-xs font-semibold">Bottle Type</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Empty Rcvd</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Filled</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Empty Left</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Sold</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Full Left</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Labels Used</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Caps Used</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.bottleSize} className="border-b" data-testid={`stock-row-${s.bottleSize}`}>
                <td className="py-2.5 px-3 font-medium">{BOTTLE_LABELS[s.bottleSize]}</td>
                <td className="py-2.5 px-3 text-right">{s.emptyReceived}</td>
                <td className="py-2.5 px-3 text-right">{s.filled}</td>
                <td className={`py-2.5 px-3 text-right font-medium ${s.emptyRemaining < 10 ? "text-orange-600" : ""}`}>{s.emptyRemaining}</td>
                <td className="py-2.5 px-3 text-right">{s.fullSold}</td>
                <td className={`py-2.5 px-3 text-right font-medium ${s.fullRemaining < 10 ? "text-orange-600" : "text-green-600"}`}>{s.fullRemaining}</td>
                <td className="py-2.5 px-3 text-right text-blue-600">{s.filled * s.labelsPerUnit}</td>
                <td className="py-2.5 px-3 text-right text-purple-600">{s.filled * s.capsPerUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Labels اور Caps کا حساب: Filled bottles × labels/caps per unit (Products میں set کریں)</p>
    </div>
  );
}

function CustomerBalanceReport() {
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray());
  const [balances, setBalances] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!customers) return;
    Promise.all(
      customers.map((c) => getCustomerBalance(c.id!).then((bal) => [c.id!, bal] as [number, number]))
    ).then((entries) => setBalances(Object.fromEntries(entries)));
  }, [customers]);

  const withBalance = (customers || []).filter((c) => balances[c.id!] > 0);
  const totalReceivable = Object.values(balances).reduce((s, b) => s + Math.max(0, b), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{withBalance.length} customers with outstanding balance</p>
        <p className="text-sm font-semibold text-destructive">Total: {formatPKR(totalReceivable)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="text-left py-2.5 px-3 text-xs font-semibold">Customer</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold">Phone</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {withBalance.map((c) => (
              <tr key={c.id} className="border-b" data-testid={`balance-row-${c.id}`}>
                <td className="py-2.5 px-3 font-medium">{c.name}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{c.phone}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-destructive">{formatPKR(balances[c.id!] || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseReport() {
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("all");

  const expenses = useLiveQuery(
    () => db.expenses.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );

  const filtered = (expenses || []).filter((e) => category === "all" || e.category === category);
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const byCategory: Record<string, number> = {};
  filtered.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap no-print">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" /></div>
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(byCategory).map(([cat, amt]) => (
          <Card key={cat}><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">{cat}</p><p className="text-lg font-bold text-orange-600">{formatPKR(amt)}</p></CardContent></Card>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-muted">
            <th className="text-left py-2.5 px-3 text-xs font-semibold">Date</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold">Category</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold">Description</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold">Amount</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No expenses found for this period</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="py-2 px-3 text-muted-foreground">{format(new Date(e.date), "dd MMM yy")}</td>
                  <td className="py-2 px-3"><Badge variant="secondary" className="text-xs">{e.category}</Badge></td>
                  <td className="py-2 px-3">{e.description || "—"}</td>
                  <td className="py-2 px-3 text-right font-semibold text-orange-600">{formatPKR(e.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot><tr className="font-bold border-t bg-muted/50">
              <td colSpan={3} className="py-2.5 px-3">Total ({filtered.length} expenses)</td>
              <td className="py-2.5 px-3 text-right text-orange-600">{formatPKR(total)}</td>
            </tr></tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function CustomerLedgerReport() {
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray());
  const invoices = useLiveQuery(
    () => selectedCustomer ? db.invoices.where("customerId").equals(selectedCustomer).toArray() : Promise.resolve([] as import("@/lib/types").Invoice[]),
    [selectedCustomer]
  );
  const payments = useLiveQuery(
    () => selectedCustomer ? db.payments.where("customerId").equals(selectedCustomer).toArray() : Promise.resolve([] as import("@/lib/types").Payment[]),
    [selectedCustomer]
  );
  const returns = useLiveQuery(
    () => selectedCustomer ? db.productReturns.where("customerId").equals(selectedCustomer).toArray() : Promise.resolve([] as import("@/lib/types").ProductReturn[]),
    [selectedCustomer]
  );

  const customer = (customers || []).find((c) => c.id === selectedCustomer);

  const filtInvoices = (invoices || []).filter((i) => i.date >= fromDate && i.date <= toDate);
  const filtPayments = (payments || []).filter((p) => p.date >= fromDate && p.date <= toDate);
  const filtReturns = (returns || []).filter((r) => r.date >= fromDate && r.date <= toDate);

  type LedgerRow = { date: string; type: string; description: string; debit: number; credit: number; };
  const rows: LedgerRow[] = [
    ...filtInvoices.map((i) => {
      const paidAmt = i.paidAmount ?? (i.paymentType === "cash" ? i.netAmount : 0);
      const unpaid = i.netAmount - paidAmt;
      const typeLabel = i.paymentType === "cash" ? "Cash Sale" : i.paymentType === "partial" ? "Partial Sale" : "Credit Sale";
      return { date: i.date, type: typeLabel, description: `${i.invoiceNumber}${i.paymentType === "partial" ? ` (Cash: Rs.${paidAmt.toLocaleString()})` : ""}`, debit: unpaid, credit: 0 };
    }),
    ...filtPayments.map((p) => ({ date: p.date, type: "Payment", description: p.notes || "Payment received", debit: 0, credit: p.amount })),
    ...filtReturns.map((r) => ({ date: r.date, type: "Return", description: `Return (${r.items.length} items)`, debit: 0, credit: r.totalCredit })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const balance = totalDebit - totalCredit;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap no-print">
        <div className="space-y-1">
          <Label className="text-xs">Search Customer</Label>
          <Input
            placeholder="Type name to search..."
            value={customerSearch}
            onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
            className="w-48"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Select Customer</Label>
          <Select value={selectedCustomer ? String(selectedCustomer) : ""} onValueChange={(v) => { setSelectedCustomer(Number(v)); setCustomerSearch(""); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Choose customer..." /></SelectTrigger>
            <SelectContent>
              {(customers || [])
                .filter((c) => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" /></div>
        {selectedCustomer && <Button variant="outline" size="sm" className="mt-5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" />Print Ledger</Button>}
      </div>
      {!selectedCustomer ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Search or select a customer to view their ledger</p>
      ) : (
        <>
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="font-bold text-lg">{customer?.name}</p>
            <p className="text-sm text-muted-foreground">{customer?.phone} {customer?.address && `• ${customer.address}`}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Total Debit (Receivable)</p><p className="text-lg font-bold text-destructive">{formatPKR(totalDebit)}</p></CardContent></Card>
            <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Total Credit (Paid+Returns)</p><p className="text-lg font-bold text-green-600">{formatPKR(totalCredit)}</p></CardContent></Card>
            <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Net Balance</p><p className={`text-lg font-bold ${balance > 0 ? "text-destructive" : "text-green-600"}`}>{formatPKR(Math.abs(balance))} {balance > 0 ? "(Due)" : "(Clear)"}</p></CardContent></Card>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-muted">
                <th className="text-left py-2.5 px-3 text-xs font-semibold">Date</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold">Type</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold">Description</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold">Debit</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold">Credit</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold">Balance</th>
              </tr></thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No transactions found for this period</td></tr>
                ) : (
                  rows.map((r, i) => {
                    running += r.debit - r.credit;
                    return (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">{format(new Date(r.date), "dd MMM yy")}</td>
                        <td className="py-2 px-3"><Badge variant={r.type === "Payment" ? "default" : r.type === "Return" ? "secondary" : "outline"} className="text-xs">{r.type}</Badge></td>
                        <td className="py-2 px-3">{r.description}</td>
                        <td className="py-2 px-3 text-right text-destructive font-medium">{r.debit > 0 ? formatPKR(r.debit) : "—"}</td>
                        <td className="py-2 px-3 text-right text-green-600 font-medium">{r.credit > 0 ? formatPKR(r.credit) : "—"}</td>
                        <td className={`py-2 px-3 text-right font-semibold ${running > 0 ? "text-destructive" : "text-green-600"}`}>{formatPKR(Math.abs(running))}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ReturnsReport() {
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const productReturns = useLiveQuery(
    () => db.productReturns.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );
  const canReturns = useLiveQuery(
    () => db.canReturns.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );
  const customers = useLiveQuery(() => db.customers.toArray());
  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c.name]));

  const totalProductCredit = (productReturns || []).reduce((s, r) => s + r.totalCredit, 0);
  const totalCanQty = (canReturns || []).reduce((s, r) => s + r.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap no-print">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" /></div>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Product Returns</p><p className="text-lg font-bold">{productReturns?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Can Returns (Qty)</p><p className="text-lg font-bold">{totalCanQty}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Product Credit Given</p><p className="text-lg font-bold text-green-600">{formatPKR(totalProductCredit)}</p></CardContent></Card>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Product Returns</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-muted">
              <th className="text-left py-2 px-3 text-xs font-semibold">Date</th>
              <th className="text-left py-2 px-3 text-xs font-semibold">Customer</th>
              <th className="text-right py-2 px-3 text-xs font-semibold">Items</th>
              <th className="text-right py-2 px-3 text-xs font-semibold">Credit</th>
            </tr></thead>
            <tbody>
              {(productReturns || []).length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No product returns found</td></tr>
              ) : (
                (productReturns || []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 px-3 text-muted-foreground">{format(new Date(r.date), "dd MMM yy")}</td>
                    <td className="py-2 px-3 font-medium">{customerMap[r.customerId] || "?"}</td>
                    <td className="py-2 px-3 text-right">{r.items.length}</td>
                    <td className="py-2 px-3 text-right text-green-600 font-semibold">{formatPKR(r.totalCredit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">19L Can Returns</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-muted">
              <th className="text-left py-2 px-3 text-xs font-semibold">Date</th>
              <th className="text-left py-2 px-3 text-xs font-semibold">Customer</th>
              <th className="text-right py-2 px-3 text-xs font-semibold">Qty</th>
              <th className="text-left py-2 px-3 text-xs font-semibold">Notes</th>
            </tr></thead>
            <tbody>
              {(canReturns || []).length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No can returns found</td></tr>
              ) : (
                (canReturns || []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 px-3 text-muted-foreground">{format(new Date(r.date), "dd MMM yy")}</td>
                    <td className="py-2 px-3 font-medium">{customerMap[r.customerId] || "?"}</td>
                    <td className="py-2 px-3 text-right font-semibold">{r.quantity} cans</td>
                    <td className="py-2 px-3 text-muted-foreground">{r.notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentsReport() {
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const payments = useLiveQuery(
    () => db.payments.where("date").between(fromDate, toDate, true, true).toArray(),
    [fromDate, toDate]
  );
  const customers = useLiveQuery(() => db.customers.toArray());
  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  const total = (payments || []).reduce((s, p) => s + p.amount, 0);
  const totalPayments = (payments || []).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap no-print">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" /></div>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" />Print</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Total Received</p><p className="text-lg font-bold text-green-600">{formatPKR(total)}</p></CardContent></Card>
        <Card><CardContent className="pt-3 pb-3"><p className="text-xs text-muted-foreground">Transactions</p><p className="text-lg font-bold">{totalPayments}</p></CardContent></Card>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-muted">
            <th className="text-left py-2.5 px-3 text-xs font-semibold">Date</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold">Customer</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold">Notes</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold">Amount</th>
          </tr></thead>
          <tbody>
            {(payments || []).length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No payments found for this period</td></tr>
            ) : (
              (payments || []).map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 px-3 text-muted-foreground">{format(new Date(p.date), "dd MMM yy")}</td>
                  <td className="py-2 px-3 font-medium">{customerMap[p.customerId]?.name || "?"}</td>
                  <td className="py-2 px-3 text-muted-foreground">{p.notes || "—"}</td>
                  <td className="py-2 px-3 text-right font-semibold text-green-600">{formatPKR(p.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          {(payments || []).length > 0 && (
            <tfoot><tr className="font-bold border-t bg-muted/50">
              <td colSpan={3} className="py-2.5 px-3">Total ({(payments || []).length} payments)</td>
              <td className="py-2.5 px-3 text-right text-green-600">{formatPKR(total)}</td>
            </tr></tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="space-y-6" data-testid="page-reports">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Business analytics and summaries</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">Product Sales</TabsTrigger>
          <TabsTrigger value="pnl" data-testid="tab-pnl">Profit &amp; Loss</TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">Stock</TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-balance">Customer Balances</TabsTrigger>
          <TabsTrigger value="ledger" data-testid="tab-ledger">Customer Ledger</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
          <TabsTrigger value="returns" data-testid="tab-returns">Returns</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyReport />
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product-wise Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSalesReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Profit &amp; Loss Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitLossReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StockReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Outstanding Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerBalanceReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Customer Ledger (Printable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerLedgerReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Expense Report (Printable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Returns Report (Printable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnsReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Payments Received Report (Printable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentsReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
