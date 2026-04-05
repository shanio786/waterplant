import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, Droplets, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { getCustomerBalance, getCustomerLedger, getCustomer19LBalance } from "@/lib/calculations";
import type { Customer, CustomerLedgerEntry } from "@/lib/types";
import { format } from "date-fns";

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function LedgerRow({ entry }: { entry: CustomerLedgerEntry }) {
  const typeColors: Record<string, string> = {
    invoice: "bg-blue-100 text-blue-700",
    payment: "bg-green-100 text-green-700",
    return: "bg-orange-100 text-orange-700",
    can_return: "bg-purple-100 text-purple-700",
  };
  const typeLabels: Record<string, string> = {
    invoice: "Invoice",
    payment: "Payment",
    return: "Return",
    can_return: "Can Return",
  };

  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 text-xs text-muted-foreground">
        {format(new Date(entry.date), "dd MMM yy")}
      </td>
      <td className="py-2.5">
        <Badge className={`text-xs ${typeColors[entry.type]}`} variant="secondary">
          {typeLabels[entry.type]}
        </Badge>
      </td>
      <td className="py-2.5 text-sm">{entry.description}</td>
      <td className="py-2.5 text-sm text-right">
        {entry.debit > 0 ? <span className="text-destructive font-medium">{formatPKR(entry.debit)}</span> : "-"}
      </td>
      <td className="py-2.5 text-sm text-right">
        {entry.credit > 0 ? <span className="text-green-600 font-medium">{formatPKR(entry.credit)}</span> : "-"}
      </td>
      <td className="py-2.5 text-sm text-right font-semibold">
        {formatPKR(entry.balance)}
      </td>
    </tr>
  );
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState(0);
  const [can19L, setCan19L] = useState(0);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.customers.get(customerId),
      getCustomerBalance(customerId),
      getCustomer19LBalance(customerId),
      getCustomerLedger(customerId),
    ]).then(([cust, bal, can, led]) => {
      if (!cust) { setLocation("/customers"); return; }
      setCustomer(cust);
      setBalance(bal);
      setCan19L(can);
      setLedger(led);
    }).finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;
  }

  if (!customer) return null;

  return (
    <div className="space-y-6" data-testid="page-customer-detail">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.address}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card data-testid="card-balance">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding Balance</p>
            <p className={`text-2xl font-bold mt-1 ${balance > 0 ? "text-destructive" : "text-green-600"}`}>
              {formatPKR(balance)}
            </p>
            {balance === 0 && <Badge className="mt-1 bg-green-100 text-green-700">Paid Up</Badge>}
          </CardContent>
        </Card>

        <Card data-testid="card-19l-balance">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">19L Cans with Customer</p>
            <div className="flex items-center gap-2 mt-1">
              <Droplets className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{can19L}</p>
              <span className="text-sm text-muted-foreground">cans</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Actions</p>
            <Link href={`/invoices/new?customer=${customerId}`}>
              <Button size="sm" className="w-full" data-testid="button-new-invoice">
                <FileText className="h-4 w-4 mr-1.5" />
                New Invoice
              </Button>
            </Link>
            <Link href={`/payments?customer=${customerId}`}>
              <Button size="sm" variant="outline" className="w-full" data-testid="button-receive-payment">
                Receive Payment
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ledger</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Debit</th>
                  <th className="text-right py-2">Credit</th>
                  <th className="text-right py-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry, i) => (
                  <LedgerRow key={i} entry={entry} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td colSpan={5} className="py-2 text-right">Current Balance:</td>
                  <td className="py-2 text-right text-destructive">{formatPKR(balance)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
