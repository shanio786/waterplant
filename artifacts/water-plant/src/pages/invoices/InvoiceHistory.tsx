import { useState } from "react";
import { Link } from "wouter";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { Search, FileText, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

type PaymentFilter = "all" | "cash" | "credit" | "partial";

export default function InvoiceHistory() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  const invoices = useLiveQuery(() =>
    db.invoices.orderBy("date").reverse().toArray()
  );
  const customers = useLiveQuery(() => db.customers.toArray());

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  const filtered = (invoices || []).filter((inv) => {
    const cust = customerMap[inv.customerId];
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (cust?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchPayment = paymentFilter === "all" || inv.paymentType === paymentFilter;
    return matchSearch && matchPayment;
  });

  function getPaymentBadge(paymentType: string) {
    if (paymentType === "cash") {
      return <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Cash</Badge>;
    } else if (paymentType === "partial") {
      return <Badge className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Partial</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">Udhaar</Badge>;
  }

  return (
    <div className="space-y-6" data-testid="page-invoice-history">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice History</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} / {invoices?.length || 0} invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
          <SelectTrigger className="w-36" data-testid="select-payment-filter">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cash">Cash Only</SelectItem>
            <SelectItem value="credit">Udhaar Only</SelectItem>
            <SelectItem value="partial">Partial Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 opacity-40" />
              <p>No invoices found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((inv) => {
            const cust = customerMap[inv.customerId];
            const paid = inv.paidAmount ?? (inv.paymentType === "cash" ? inv.netAmount : 0);
            const balance = inv.netAmount - paid;
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="block" data-testid={`invoice-${inv.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{inv.invoiceNumber}</span>
                          {getPaymentBadge(inv.paymentType)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cust?.name || "Unknown"} — {format(new Date(inv.date), "dd MMM yyyy")}
                        </p>
                        {inv.paymentType === "partial" && balance > 0 && (
                          <p className="text-xs text-orange-500 font-medium">Udhaar: {formatPKR(balance)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatPKR(inv.netAmount)}</div>
                        {inv.paymentType === "credit" && (
                          <div className="text-xs text-orange-500">{formatPKR(inv.netAmount)} due</div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
