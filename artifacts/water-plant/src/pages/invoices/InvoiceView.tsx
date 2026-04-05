import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { BOTTLE_LABELS } from "@/lib/types";
import type { Invoice, Customer } from "@/lib/types";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

function A4Invoice({ invoice, customer }: { invoice: Invoice; customer: Customer | null }) {
  return (
    <div className="bg-white text-black p-8 min-h-[297mm] font-sans" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">Water Plant Manager</h1>
          <p className="text-gray-500 text-sm">Invoice Management System</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700">Invoice #</p>
          <p className="text-xl font-bold text-blue-800">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-500">{format(new Date(invoice.date), "dd MMMM yyyy")}</p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Customer info */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bill To</p>
        <p className="font-semibold text-gray-900 text-lg">{customer?.name || "N/A"}</p>
        <p className="text-sm text-gray-600">{customer?.phone}</p>
        <p className="text-sm text-gray-600">{customer?.address}</p>
      </div>

      {/* Items table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-blue-50">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase">Item</th>
            <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase">Qty</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase">Rate</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2.5 px-3 text-sm">{BOTTLE_LABELS[item.bottleSize]}</td>
              <td className="py-2.5 px-3 text-sm text-center">{item.quantity}</td>
              <td className="py-2.5 px-3 text-sm text-right">{formatPKR(item.rate)}</td>
              <td className="py-2.5 px-3 text-sm text-right font-medium">{formatPKR(item.amount)}</td>
            </tr>
          ))}
          {invoice.returnNote && (
            <tr className="border-b border-gray-100 bg-green-50">
              <td className="py-2.5 px-3 text-sm text-green-700" colSpan={3}>Return Adjustment: {invoice.returnNote}</td>
              <td className="py-2.5 px-3 text-sm text-right font-medium text-green-700">- {formatPKR(invoice.returnAdjustment)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto w-64 space-y-1.5 mb-6">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{formatPKR(invoice.subtotal)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Discount ({invoice.discountType === "percent" ? `${invoice.discountValue}%` : "flat"})</span>
            <span>- {formatPKR(invoice.discountAmount)}</span>
          </div>
        )}
        {invoice.returnAdjustment > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Return</span>
            <span>- {formatPKR(invoice.returnAdjustment)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-blue-800">
          <span>Net Total</span>
          <span className="text-lg">{formatPKR(invoice.netAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payment</span>
          <span className={`font-medium ${invoice.paymentType === "cash" ? "text-green-700" : "text-orange-600"}`}>
            {invoice.paymentType === "cash" ? "Cash" : "Credit (Udhaar)"}
          </span>
        </div>
      </div>

      {invoice.notes && (
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-xs text-gray-500 font-semibold mb-1">Notes</p>
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 mt-8">
        Thank you for your business — Water Plant Manager
      </div>
    </div>
  );
}

function ThermalReceipt({ invoice, customer }: { invoice: Invoice; customer: Customer | null }) {
  return (
    <div style={{ width: "80mm", fontFamily: "'Courier New', monospace", fontSize: "12px", padding: "4mm" }} className="bg-white text-black">
      <div className="text-center mb-2">
        <p className="font-bold text-sm">WATER PLANT</p>
        <p className="text-xs">Management System</p>
        <p className="text-xs">----------------------------</p>
      </div>
      <p className="text-xs">Invoice: {invoice.invoiceNumber}</p>
      <p className="text-xs">Date: {format(new Date(invoice.date), "dd/MM/yyyy")}</p>
      <p className="text-xs">Customer: {customer?.name}</p>
      <p className="text-xs">Phone: {customer?.phone}</p>
      <p className="text-xs">----------------------------</p>
      {invoice.items.map((item, i) => (
        <div key={i} className="text-xs">
          <p>{BOTTLE_LABELS[item.bottleSize]}</p>
          <p className="flex justify-between">
            <span>  {item.quantity} x {formatPKR(item.rate)}</span>
            <span>{formatPKR(item.amount)}</span>
          </p>
        </div>
      ))}
      {invoice.returnNote && (
        <>
          <p className="text-xs">----------------------------</p>
          <p className="text-xs">Return: {invoice.returnNote}</p>
          <p className="text-xs text-right">- {formatPKR(invoice.returnAdjustment)}</p>
        </>
      )}
      <p className="text-xs">----------------------------</p>
      {invoice.discountAmount > 0 && (
        <div className="flex justify-between text-xs">
          <span>Discount:</span>
          <span>- {formatPKR(invoice.discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold">
        <span>TOTAL:</span>
        <span>{formatPKR(invoice.netAmount)}</span>
      </div>
      <p className="text-xs">Payment: {invoice.paymentType === "cash" ? "Cash" : "Udhaar"}</p>
      <p className="text-xs text-center mt-2">*** Thank You ***</p>
    </div>
  );
}

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [printMode, setPrintMode] = useState<"a4" | "thermal">("a4");

  useEffect(() => {
    db.invoices.get(Number(id)).then((inv) => {
      if (!inv) return;
      setInvoice(inv);
      db.customers.get(inv.customerId).then(setCustomer);
    });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4" data-testid="page-invoice-view">
      {/* Controls */}
      <div className="flex items-center gap-3 no-print">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">{invoice.invoiceNumber}</h1>
        <div className="flex gap-2">
          <Button
            variant={printMode === "a4" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrintMode("a4")}
            data-testid="button-a4"
          >
            A4
          </Button>
          <Button
            variant={printMode === "thermal" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrintMode("thermal")}
            data-testid="button-thermal"
          >
            Thermal
          </Button>
          <Button size="sm" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {printMode === "a4" ? (
            <A4Invoice invoice={invoice} customer={customer} />
          ) : (
            <div className="flex justify-center p-6 bg-gray-100">
              <ThermalReceipt invoice={invoice} customer={customer} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
