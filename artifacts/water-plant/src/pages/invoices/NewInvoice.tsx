import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { db, generateInvoiceNumber } from "@/lib/db";
import { BOTTLE_SIZES, BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize, DiscountType } from "@/lib/types";
import { calculateInvoiceAmounts } from "@/lib/calculations";
import { Plus, Trash2, FileText } from "lucide-react";

const itemSchema = z.object({
  bottleSize: z.enum(["500ml", "1.5L", "5L", "19L"]),
  quantity: z.coerce.number().int().positive(),
  rate: z.coerce.number().positive(),
});

const schema = z.object({
  customerId: z.coerce.number().positive("Please select a customer"),
  date: z.string().min(1),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  discountType: z.enum(["flat", "percent"]),
  discountValue: z.coerce.number().min(0),
  returnAdjustment: z.coerce.number().min(0),
  returnNote: z.string().optional(),
  paymentType: z.enum(["cash", "credit"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;
}

export default function NewInvoice() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedCustomer = params.get("customer");
  const { toast } = useToast();
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray(), []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: preselectedCustomer ? Number(preselectedCustomer) : 0,
      date: new Date().toISOString().slice(0, 10),
      items: [{ bottleSize: "19L", quantity: 1, rate: 0 }],
      discountType: "flat",
      discountValue: 0,
      returnAdjustment: 0,
      returnNote: "",
      paymentType: "cash",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discountValue");
  const watchedDiscountType = form.watch("discountType");
  const watchedReturn = form.watch("returnAdjustment");

  const { subtotal, discountAmount, netAmount } = calculateInvoiceAmounts(
    watchedItems.map((i) => ({ quantity: i.quantity || 0, rate: i.rate || 0 })),
    watchedDiscountType as DiscountType,
    watchedDiscount || 0,
    watchedReturn || 0
  );

  async function onSubmit(data: FormData) {
    const invNum = await generateInvoiceNumber();
    const { subtotal, discountAmount, netAmount } = calculateInvoiceAmounts(
      data.items.map((i) => ({ quantity: i.quantity, rate: i.rate })),
      data.discountType,
      data.discountValue,
      data.returnAdjustment
    );

    const invoiceId = await db.invoices.add({
      invoiceNumber: invNum,
      customerId: data.customerId,
      date: data.date,
      items: data.items.map((item) => ({
        bottleSize: item.bottleSize as BottleSize,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      })),
      discountType: data.discountType as DiscountType,
      discountValue: data.discountValue,
      discountAmount,
      returnAdjustment: data.returnAdjustment,
      returnNote: data.returnNote || "",
      subtotal,
      netAmount,
      paymentType: data.paymentType,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });

    toast({ title: "Invoice created", description: `Invoice #${invNum} — ${formatPKR(netAmount)}` });
    setLocation(`/invoices/${invoiceId}`);
  }

  return (
    <div className="max-w-3xl space-y-6" data-testid="page-new-invoice">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-sm text-muted-foreground">Create a sales invoice</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer + date */}
        <Card>
          <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={String(form.watch("customerId") || "")}
                onValueChange={(v) => form.setValue("customerId", Number(v))}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} — {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && (
                <p className="text-xs text-destructive">{form.formState.errors.customerId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" data-testid="input-date" {...form.register("date")} />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Items</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ bottleSize: "19L", quantity: 1, rate: 0 })}
                data-testid="button-add-item"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => {
              const qty = watchedItems[index]?.quantity || 0;
              const rate = watchedItems[index]?.rate || 0;
              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end" data-testid={`item-row-${index}`}>
                  <div className="col-span-4">
                    {index === 0 && <Label className="text-xs mb-1 block">Bottle Type</Label>}
                    <Select
                      value={form.watch(`items.${index}.bottleSize`)}
                      onValueChange={(v) => form.setValue(`items.${index}.bottleSize`, v as BottleSize)}
                    >
                      <SelectTrigger className="h-9 text-sm" data-testid={`select-bottle-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_SIZES.map((s) => (
                          <SelectItem key={s} value={s}>{BOTTLE_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    {index === 0 && <Label className="text-xs mb-1 block">Qty</Label>}
                    <Input
                      type="number"
                      min={1}
                      className="h-9 text-sm"
                      data-testid={`input-qty-${index}`}
                      {...form.register(`items.${index}.quantity`)}
                    />
                  </div>
                  <div className="col-span-3">
                    {index === 0 && <Label className="text-xs mb-1 block">Rate (Rs.)</Label>}
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-9 text-sm"
                      data-testid={`input-rate-${index}`}
                      {...form.register(`items.${index}.rate`)}
                    />
                  </div>
                  <div className="col-span-1 text-xs text-right text-muted-foreground">
                    {index === 0 && <div className="text-xs mb-1 opacity-0">-</div>}
                    {formatPKR(qty * rate)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {index === 0 && <div className="text-xs mb-1 opacity-0">-</div>}
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => remove(index)} data-testid={`button-remove-${index}`}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {form.formState.errors.items && (
              <p className="text-xs text-destructive">{(form.formState.errors.items as { message?: string })?.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Discount + return adjustment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Type</Label>
                <Select
                  value={form.watch("discountType")}
                  onValueChange={(v) => form.setValue("discountType", v as DiscountType)}
                >
                  <SelectTrigger className="h-9 text-sm" data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat (Rs.)</SelectItem>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Value</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-9 text-sm"
                  data-testid="input-discount-value"
                  {...form.register("discountValue")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Amount</Label>
                <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-sm font-medium">
                  {formatPKR(discountAmount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Return Adjustment (Rs.)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-9 text-sm"
                  placeholder="0"
                  data-testid="input-return-adjustment"
                  {...form.register("returnAdjustment")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Return Note (e.g. 50 bottles returned)</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. 50 khali wapas di"
                  data-testid="input-return-note"
                  {...form.register("returnNote")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount ({watchedDiscountType === "percent" ? `${watchedDiscount}%` : "flat"})</span>
                <span className="text-green-600">- {formatPKR(discountAmount)}</span>
              </div>
            )}
            {(watchedReturn || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Return Adjustment</span>
                <span className="text-green-600">- {formatPKR(watchedReturn || 0)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Net Total</span>
              <span className="text-primary text-lg">{formatPKR(netAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment type + notes */}
        <Card>
          <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select
                value={form.watch("paymentType")}
                onValueChange={(v) => form.setValue("paymentType", v as "cash" | "credit")}
              >
                <SelectTrigger data-testid="select-payment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit (Udhaar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="Any notes..." data-testid="input-notes" {...form.register("notes")} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" data-testid="button-create-invoice">
          <FileText className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </form>
    </div>
  );
}
