import { useState } from "react";
import { Link } from "wouter";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { Search, FileText, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export default function InvoiceHistory() {
  const [search, setSearch] = useState("");

  const invoices = useLiveQuery(() =>
    db.invoices.orderBy("date").reverse().toArray()
  );
  const customers = useLiveQuery(() => db.customers.toArray());

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  const filtered = (invoices || []).filter((inv) => {
    const cust = customerMap[inv.customerId];
    return (
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      cust?.name.toLowerCase().includes(search.toLowerCase()) ||
      ""
    );
  });

  return (
    <div className="space-y-6" data-testid="page-invoice-history">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice History</h1>
          <p className="text-sm text-muted-foreground">{invoices?.length || 0} invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
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
                          <Badge
                            variant={inv.paymentType === "cash" ? "default" : "outline"}
                            className={`text-xs ${inv.paymentType === "credit" ? "border-orange-400 text-orange-600" : ""}`}
                          >
                            {inv.paymentType === "cash" ? "Cash" : "Udhaar"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{cust?.name || "Unknown"} — {format(new Date(inv.date), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{formatPKR(inv.netAmount)}</span>
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
