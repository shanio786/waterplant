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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { db, generateInvoiceNumber } from "@/lib/db";
import type { DiscountType } from "@/lib/types";
import { calculateInvoiceAmounts } from "@/lib/calculations";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Plus, Trash2, FileText } from "lucide-react";

const itemSchema = z.object({
  productId: z.coerce.number().positive("Select a product"),
  quantity: z.coerce.number().int().positive("Min 1"),
  rate: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  unitType: z.enum(["single", "pack"]).default("single"),
  packCount: z.coerce.number().min(0).default(0),
  packRate: z.coerce.number().min(0).default(0),
  packSize: z.coerce.number().min(0).default(0),
});

const schema = z.object({
  customerId: z.coerce.number().positive("Please select a customer"),
  date: z.string().min(1),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  discountType: z.enum(["flat", "percent"]),
  discountValue: z.coerce.number().min(0),
  returnAdjustment: z.coerce.number().min(0),
  returnNote: z.string().optional(),
  paymentType: z.enum(["cash", "credit", "partial"]),
  paidAmount: z.coerce.number().min(0),
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
  const products = useLiveQuery(() => db.products.filter((p) => p.isActive).toArray(), []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: preselectedCustomer ? Number(preselectedCustomer) : 0,
      date: new Date().toISOString().slice(0, 10),
      items: [{ productId: 0, quantity: 1, rate: 0, costPrice: 0, unitType: "single" as const, packCount: 0, packRate: 0, packSize: 0 }],
      discountType: "flat",
      discountValue: 0,
      returnAdjustment: 0,
      returnNote: "",
      paymentType: "cash",
      paidAmount: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discountValue");
  const watchedDiscountType = form.watch("discountType");
  const watchedReturn = form.watch("returnAdjustment");
  const watchedPaymentType = form.watch("paymentType");
  const watchedPaid = form.watch("paidAmount");

  const { subtotal, discountAmount, netAmount } = calculateInvoiceAmounts(
    watchedItems.map((i) => {
      if (i.unitType === "pack" && (i.packCount || 0) > 0) {
        return { quantity: 1, rate: (i.packCount || 0) * (i.packRate || 0) };
      }
      return { quantity: i.quantity || 0, rate: i.rate || 0 };
    }),
    watchedDiscountType as DiscountType,
    watchedDiscount || 0,
    watchedReturn || 0
  );

  // Auto-set paidAmount when paymentType changes
  useEffect(() => {
    if (watchedPaymentType === "cash") {
      form.setValue("paidAmount", netAmount);
    } else if (watchedPaymentType === "credit") {
      form.setValue("paidAmount", 0);
    }
    // partial: user sets manually
  }, [watchedPaymentType, netAmount]);

  const creditAmount = netAmount - (watchedPaid || 0);

  function handleProductChange(index: number, productId: number) {
    form.setValue(`items.${index}.productId`, productId);
    const prod = products?.find((p) => p.id === productId);
    if (prod) {
      form.setValue(`items.${index}.rate`, prod.sellingPrice);
      form.setValue(`items.${index}.costPrice`, prod.costPrice);
      form.setValue(`items.${index}.unitType`, "single");
      form.setValue(`items.${index}.packSize`, prod.packSize || 0);
      form.setValue(`items.${index}.packRate`, prod.packSellingPrice || 0);
      form.setValue(`items.${index}.packCount`, 0);
    }
  }

  function handleUnitTypeChange(index: number, type: "single" | "pack") {
    form.setValue(`items.${index}.unitType`, type);
    if (type === "pack") {
      const prod = products?.find((p) => p.id === form.getValues(`items.${index}.productId`));
      form.setValue(`items.${index}.packSize`, prod?.packSize || 0);
      form.setValue(`items.${index}.packRate`, prod?.packSellingPrice || 0);
      form.setValue(`items.${index}.packCount`, 1);
    }
  }

  async function onSubmit(data: FormData) {
    const productMap = Object.fromEntries((products || []).map((p) => [p.id!, p]));
    const invNum = await generateInvoiceNumber();
    const { subtotal, discountAmount, netAmount } = calculateInvoiceAmounts(
      data.items.map((i) => {
        if (i.unitType === "pack" && (i.packCount || 0) > 0) {
          return { quantity: 1, rate: (i.packCount || 0) * (i.packRate || 0) };
        }
        return { quantity: i.quantity, rate: i.rate };
      }),
      data.discountType,
      data.discountValue,
      data.returnAdjustment
    );

    const paidAmount =
      data.paymentType === "cash"
        ? netAmount
        : data.paymentType === "credit"
        ? 0
        : Math.min(data.paidAmount, netAmount);

    const invoiceId = await db.invoices.add({
      invoiceNumber: invNum,
      customerId: data.customerId,
      date: data.date,
      items: data.items.map((item) => {
        const prod = productMap[item.productId];
        if (item.unitType === "pack" && (item.packCount || 0) > 0) {
          const pSize = item.packSize || prod?.packSize || 1;
          const pRate = item.packRate || 0;
          const pCount = item.packCount || 0;
          return {
            productId: item.productId,
            productName: prod?.name || "Unknown",
            bottleSize: prod?.bottleSize,
            quantity: pCount * pSize,
            rate: pSize > 0 ? pRate / pSize : pRate,
            costPrice: item.costPrice,
            amount: pCount * pRate,
            packCount: pCount,
            packSize: pSize,
            packRate: pRate,
          };
        }
        return {
          productId: item.productId,
          productName: prod?.name || "Unknown",
          bottleSize: prod?.bottleSize,
          quantity: item.quantity,
          rate: item.rate,
          costPrice: item.costPrice,
          amount: item.quantity * item.rate,
        };
      }),
      discountType: data.discountType as DiscountType,
      discountValue: data.discountValue,
      discountAmount,
      returnAdjustment: data.returnAdjustment,
      returnNote: data.returnNote || "",
      subtotal,
      netAmount,
      paidAmount,
      paymentType: data.paymentType as "cash" | "credit" | "partial",
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });

    toast({ title: "Invoice created", description: `#${invNum} — ${formatPKR(netAmount)}` });
    setLocation(`/invoices/${invoiceId}`);
  }

  const customerOptions = (customers || []).map((c) => ({
    value: String(c.id),
    label: c.name,
    sub: c.phone,
  }));

  const productOptions = (products || []).map((p) => ({
    value: String(p.id),
    label: p.name,
    sub: `${p.unit} — ${formatPKR(p.sellingPrice)}`,
  }));

  return (
    <div className="max-w-3xl space-y-6" data-testid="page-new-invoice">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-sm text-muted-foreground">Create a sales invoice</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <SearchableSelect
                options={customerOptions}
                value={String(form.watch("customerId") || "")}
                onChange={(v) => form.setValue("customerId", Number(v))}
                placeholder="Select customer..."
                searchPlaceholder="Search by name or phone..."
                data-testid="select-customer"
              />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Items</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ productId: 0, quantity: 1, rate: 0, costPrice: 0, unitType: "single", packCount: 0, packRate: 0, packSize: 0 })}
                data-testid="button-add-item"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => {
              const item = watchedItems[index];
              const qty = item?.quantity || 0;
              const rate = item?.rate || 0;
              const unitType = item?.unitType || "single";
              const packCount = item?.packCount || 0;
              const packRate = item?.packRate || 0;
              const packSize = item?.packSize || 0;
              const isPack = unitType === "pack";
              const rowAmount = isPack ? packCount * packRate : qty * rate;
              const selectedProd = products?.find((p) => p.id === (item?.productId || 0));
              const hasPack = (selectedProd?.packSize || 0) > 0;
              return (
                <div key={field.id} className="space-y-2" data-testid={`item-row-${index}`}>
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {index === 0 && <Label className="text-xs mb-1 block">Product</Label>}
                      <SearchableSelect
                        options={productOptions}
                        value={String(form.watch(`items.${index}.productId`) || "")}
                        onChange={(v) => handleProductChange(index, Number(v))}
                        placeholder="Select product..."
                        searchPlaceholder="Search product..."
                        data-testid={`select-product-${index}`}
                      />
                    </div>
                    {!isPack && (
                      <>
                        <div className="col-span-2">
                          {index === 0 && <Label className="text-xs mb-1 block">Qty (bottles)</Label>}
                          <Input
                            type="number" min={1} className="h-9 text-sm"
                            data-testid={`input-qty-${index}`}
                            {...form.register(`items.${index}.quantity`)}
                          />
                        </div>
                        <div className="col-span-2">
                          {index === 0 && <Label className="text-xs mb-1 block">Rate/bottle</Label>}
                          <Input
                            type="number" min={0} step="0.01" className="h-9 text-sm"
                            data-testid={`input-rate-${index}`}
                            {...form.register(`items.${index}.rate`)}
                          />
                        </div>
                      </>
                    )}
                    {isPack && (
                      <>
                        <div className="col-span-2">
                          {index === 0 && <Label className="text-xs mb-1 block">Pet count</Label>}
                          <Input
                            type="number" min={1} className="h-9 text-sm border-purple-300"
                            placeholder="Pets"
                            data-testid={`input-pack-count-${index}`}
                            {...form.register(`items.${index}.packCount`)}
                          />
                        </div>
                        <div className="col-span-2">
                          {index === 0 && <Label className="text-xs mb-1 block">Rate/pet</Label>}
                          <Input
                            type="number" min={0} step="0.01" className="h-9 text-sm border-purple-300"
                            placeholder="Pet price"
                            data-testid={`input-pack-rate-${index}`}
                            {...form.register(`items.${index}.packRate`)}
                          />
                        </div>
                      </>
                    )}
                    <div className="col-span-2 text-xs text-right text-muted-foreground pt-1">
                      {index === 0 && <div className="text-xs mb-1 opacity-0">-</div>}
                      <div className="h-9 flex items-center justify-end font-medium text-sm">
                        {formatPKR(rowAmount)}
                      </div>
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
                  {hasPack && (
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-xs text-muted-foreground">Sell as:</span>
                      <button
                        type="button"
                        onClick={() => handleUnitTypeChange(index, "single")}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!isPack ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 text-muted-foreground hover:border-primary"}`}
                      >
                        Bottle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnitTypeChange(index, "pack")}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${isPack ? "bg-purple-600 text-white border-purple-600" : "border-muted-foreground/30 text-muted-foreground hover:border-purple-400"}`}
                        data-testid={`button-unit-type-pack-${index}`}
                      >
                        Pet ({packSize} pcs)
                      </button>
                      {isPack && packCount > 0 && (
                        <span className="text-xs text-purple-600 font-medium ml-2">
                          = {packCount * packSize} bottles in stock
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {form.formState.errors.items && (
              <p className="text-xs text-destructive">{(form.formState.errors.items as { message?: string })?.message}</p>
            )}
          </CardContent>
        </Card>

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
                <Input type="number" min={0} step="0.01" className="h-9 text-sm" data-testid="input-discount-value" {...form.register("discountValue")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Amount</Label>
                <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-sm font-medium">{formatPKR(discountAmount)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Return Adjustment (Rs.)</Label>
                <Input type="number" min={0} step="0.01" className="h-9 text-sm" placeholder="0" data-testid="input-return-adjustment" {...form.register("returnAdjustment")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Return Note</Label>
                <Input className="h-9 text-sm" placeholder="e.g. 5 bottles returned" data-testid="input-return-note" {...form.register("returnNote")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">- {formatPKR(discountAmount)}</span>
              </div>
            )}
            {(watchedReturn || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Return</span>
                <span className="text-green-600">- {formatPKR(watchedReturn || 0)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Net Total</span>
              <span className="text-primary text-lg">{formatPKR(netAmount)}</span>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Est. Cost: {formatPKR(watchedItems.reduce((s, i) => {
                const bottles = i.unitType === "pack" && (i.packCount || 0) > 0
                  ? (i.packCount || 0) * (i.packSize || 0)
                  : (i.quantity || 0);
                return s + bottles * (i.costPrice || 0);
              }, 0))} |
              Gross Profit: {formatPKR(netAmount - watchedItems.reduce((s, i) => {
                const bottles = i.unitType === "pack" && (i.packCount || 0) > 0
                  ? (i.packCount || 0) * (i.packSize || 0)
                  : (i.quantity || 0);
                return s + bottles * (i.costPrice || 0);
              }, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment Type</Label>
                <Select
                  value={form.watch("paymentType")}
                  onValueChange={(v) => form.setValue("paymentType", v as "cash" | "credit" | "partial")}
                >
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash (Full)</SelectItem>
                    <SelectItem value="credit">Credit / Udhaar (Full)</SelectItem>
                    <SelectItem value="partial">Partial (Cash + Udhaar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any notes..." data-testid="input-notes" {...form.register("notes")} />
              </div>
            </div>

            {watchedPaymentType === "partial" && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1.5">
                  <Label className="text-sm">Cash Received (Rs.)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={netAmount}
                    step="0.01"
                    className="h-9"
                    placeholder="0"
                    data-testid="input-paid-amount"
                    {...form.register("paidAmount")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-orange-600">Remaining Credit (Udhaar)</Label>
                  <div className="h-9 flex items-center px-3 border rounded-md bg-orange-50 text-orange-700 font-bold text-sm">
                    {formatPKR(Math.max(0, creditAmount))}
                  </div>
                </div>
              </div>
            )}
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
