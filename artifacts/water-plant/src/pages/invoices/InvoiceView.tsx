import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Invoice, Customer, BusinessSettings } from "@/lib/types";
import { ArrowLeft, Printer, Droplets } from "lucide-react";
import { format } from "date-fns";

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

function getItemLabel(item: Invoice["items"][number]): string {
  if (item.productName) return item.productName;
  return item.bottleSize ?? "Item";
}

function paymentLabel(inv: Invoice) {
  if (inv.paymentType === "cash") return "Cash";
  if (inv.paymentType === "credit") return "Credit (Udhaar)";
  const paid = inv.paidAmount ?? 0;
  const credit = inv.netAmount - paid;
  return `Partial — Cash ${formatPKR(paid)}, Udhaar ${formatPKR(credit)}`;
}

function A4Invoice({
  invoice,
  customer,
  settings,
}: {
  invoice: Invoice;
  customer: Customer | null;
  settings: BusinessSettings | null;
}) {
  const paid = invoice.paidAmount ?? (invoice.paymentType === "cash" ? invoice.netAmount : 0);
  const balance = invoice.netAmount - paid;

  return (
    <div className="bg-white text-black p-8 min-h-[297mm] font-sans" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">{settings?.companyName || "Water Plant"}</h1>
          {settings?.phone && <p className="text-sm text-gray-500">📞 {settings.phone}</p>}
          {settings?.address && (
            <p className="text-sm text-gray-500">
              📍 {settings.address}{settings.city ? `, ${settings.city}` : ""}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-500 uppercase">Invoice</p>
          <p className="text-xl font-bold text-blue-800">{invoice.invoiceNumber}</p>
          <p className="text-sm text-gray-500">{format(new Date(invoice.date), "dd MMMM yyyy")}</p>
          <Badge
            className={`mt-1 text-xs ${invoice.paymentType === "cash" ? "bg-green-100 text-green-700" : invoice.paymentType === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"}`}
            variant="secondary"
          >
            {invoice.paymentType === "cash" ? "Cash" : invoice.paymentType === "partial" ? "Partial" : "Credit (Udhaar)"}
          </Badge>
        </div>
      </div>

      <Separator className="mb-5" />

      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bill To</p>
        <p className="font-semibold text-gray-900 text-lg">{customer?.name || "N/A"}</p>
        {customer?.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
        {customer?.address && <p className="text-sm text-gray-600">{customer.address}</p>}
      </div>

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
              <td className="py-2.5 px-3 text-sm">{getItemLabel(item)}</td>
              <td className="py-2.5 px-3 text-sm text-center">{item.quantity}</td>
              <td className="py-2.5 px-3 text-sm text-right">{formatPKR(item.rate)}</td>
              <td className="py-2.5 px-3 text-sm text-right font-medium">{formatPKR(item.amount)}</td>
            </tr>
          ))}
          {invoice.returnNote && (
            <tr className="border-b border-gray-100 bg-green-50">
              <td className="py-2.5 px-3 text-sm text-green-700" colSpan={3}>Return: {invoice.returnNote}</td>
              <td className="py-2.5 px-3 text-sm text-right font-medium text-green-700">- {formatPKR(invoice.returnAdjustment)}</td>
            </tr>
          )}
        </tbody>
      </table>

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
        {invoice.paymentType === "partial" && (
          <>
            <div className="flex justify-between text-sm text-green-700">
              <span>Cash Received</span>
              <span>{formatPKR(paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-orange-600">
              <span>Remaining (Udhaar)</span>
              <span>{formatPKR(balance)}</span>
            </div>
          </>
        )}
        {invoice.paymentType !== "partial" && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment</span>
            <span className={`font-medium ${invoice.paymentType === "cash" ? "text-green-700" : "text-orange-600"}`}>
              {invoice.paymentType === "cash" ? "Cash" : "Credit (Udhaar)"}
            </span>
          </div>
        )}
      </div>

      {invoice.notes && (
        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-xs text-gray-500 font-semibold mb-1">Notes</p>
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {settings?.footerNote && (
        <div className="text-center text-xs text-gray-400 mt-8 border-t pt-4">
          {settings.footerNote}
        </div>
      )}
      <div className="text-center text-[10px] text-gray-300 mt-4">
        Powered by Devoria Tech &nbsp;|&nbsp; +92 311 7597815
      </div>
    </div>
  );
}

function ThermalReceipt({
  invoice,
  customer,
  settings,
}: {
  invoice: Invoice;
  customer: Customer | null;
  settings: BusinessSettings | null;
}) {
  const paid = invoice.paidAmount ?? (invoice.paymentType === "cash" ? invoice.netAmount : 0);
  const balance = invoice.netAmount - paid;

  return (
    <div style={{ width: "80mm", fontFamily: "'Courier New', monospace", fontSize: "12px", padding: "4mm" }} className="bg-white text-black">
      <div className="text-center mb-2">
        <p className="font-bold text-sm">{settings?.companyName?.toUpperCase() || "WATER PLANT"}</p>
        {settings?.phone && <p className="text-xs">{settings.phone}</p>}
        {settings?.address && <p className="text-xs">{settings.address}</p>}
        <p className="text-xs">----------------------------</p>
      </div>
      <p className="text-xs">Invoice: {invoice.invoiceNumber}</p>
      <p className="text-xs">Date: {format(new Date(invoice.date), "dd/MM/yyyy")}</p>
      <p className="text-xs">Customer: {customer?.name}</p>
      {customer?.phone && <p className="text-xs">Phone: {customer.phone}</p>}
      <p className="text-xs">----------------------------</p>
      {invoice.items.map((item, i) => (
        <div key={i} className="text-xs">
          <p>{getItemLabel(item)}</p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>  {item.quantity} x {formatPKR(item.rate)}</span>
            <span>{formatPKR(item.amount)}</span>
          </div>
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
        <div style={{ display: "flex", justifyContent: "space-between" }} className="text-xs">
          <span>Discount:</span>
          <span>- {formatPKR(invoice.discountAmount)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between" }} className="text-sm font-bold">
        <span>TOTAL:</span>
        <span>{formatPKR(invoice.netAmount)}</span>
      </div>
      {invoice.paymentType === "partial" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }} className="text-xs">
            <span>Cash:</span><span>{formatPKR(paid)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }} className="text-xs font-bold">
            <span>Udhaar:</span><span>{formatPKR(balance)}</span>
          </div>
        </>
      )}
      {invoice.paymentType !== "partial" && (
        <p className="text-xs">Payment: {invoice.paymentType === "cash" ? "Cash" : "Udhaar"}</p>
      )}
      <p className="text-xs text-center mt-2">{settings?.footerNote || "*** Thank You ***"}</p>
      <p className="text-center mt-1" style={{ fontSize: "9px", color: "#999" }}>Powered by Devoria Tech | +92 311 7597815</p>
    </div>
  );
}

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [printMode, setPrintMode] = useState<"a4" | "thermal">("a4");

  useEffect(() => {
    db.businessSettings.toCollection().first().then((s) => setSettings(s ?? null));
    db.invoices.get(Number(id)).then((inv) => {
      if (!inv) return;
      setInvoice(inv);
      db.customers.get(inv.customerId).then((c) => setCustomer(c ?? null));
    });
  }, [id]);

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const has19LItems = invoice.items.some((item) => item.bottleSize === "19L");

  return (
    <div className="space-y-4" data-testid="page-invoice-view">
      <div className="flex items-center gap-3 no-print">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">{invoice.invoiceNumber}</h1>
        <div className="flex gap-2 flex-wrap justify-end">
          {has19LItems && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => setLocation(`/returns/can?customer=${invoice.customerId}&invoice=${invoice.id}`)}
              data-testid="button-can-return"
            >
              <Droplets className="h-4 w-4 mr-1.5" />
              Return Cans
            </Button>
          )}
          <Button variant={printMode === "a4" ? "default" : "outline"} size="sm" onClick={() => setPrintMode("a4")} data-testid="button-a4">A4</Button>
          <Button variant={printMode === "thermal" ? "default" : "outline"} size="sm" onClick={() => setPrintMode("thermal")} data-testid="button-thermal">Thermal</Button>
          <Button size="sm" onClick={() => window.print()} data-testid="button-print">
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {printMode === "a4" ? (
            <A4Invoice invoice={invoice} customer={customer} settings={settings} />
          ) : (
            <div className="flex justify-center p-6 bg-gray-100">
              <ThermalReceipt invoice={invoice} customer={customer} settings={settings} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
