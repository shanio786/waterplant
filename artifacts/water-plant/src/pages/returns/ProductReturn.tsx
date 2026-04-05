import { useState, useEffect } from "react";
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
import { db } from "@/lib/db";
import { BOTTLE_SIZES, BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize, Invoice } from "@/lib/types";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const itemSchema = z.object({
  bottleSize: z.enum(["500ml", "1.5L", "5L", "19L"]),
  quantity: z.coerce.number().int().positive(),
  rate: z.coerce.number().min(0),
});

const schema = z.object({
  customerId: z.coerce.number().positive("Select a customer"),
  invoiceId: z.coerce.number().optional(),
  date: z.string().min(1),
  items: z.array(itemSchema).min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export default function ProductReturn() {
  const { toast } = useToast();
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray());
  const recent = useLiveQuery(() => db.productReturns.orderBy("date").reverse().limit(10).toArray());
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: 0,
      invoiceId: undefined,
      date: new Date().toISOString().slice(0, 10),
      items: [{ bottleSize: "19L", quantity: 1, rate: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = form.watch("items");
  const watchedCustomer = form.watch("customerId");
  const totalCredit = watchedItems.reduce((s, i) => s + ((i.quantity || 0) * (i.rate || 0)), 0);

  useEffect(() => {
    if (watchedCustomer) {
      db.invoices.where("customerId").equals(watchedCustomer).reverse().toArray().then(setCustomerInvoices);
      form.setValue("invoiceId", undefined);
    } else {
      setCustomerInvoices([]);
    }
  }, [watchedCustomer]);

  async function onSubmit(data: FormData) {
    const items = data.items.map((i) => ({
      bottleSize: i.bottleSize as BottleSize,
      quantity: i.quantity,
      rate: i.rate,
      credit: i.quantity * i.rate,
    }));
    const totalCredit = items.reduce((s, i) => s + i.credit, 0);
    await db.productReturns.add({
      customerId: data.customerId,
      invoiceId: data.invoiceId || undefined,
      date: data.date,
      items,
      totalCredit,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Return recorded", description: `Credit: ${formatPKR(totalCredit)}` });
    form.reset({ customerId: 0, invoiceId: undefined, date: new Date().toISOString().slice(0, 10), items: [{ bottleSize: "19L", quantity: 1, rate: 0 }], notes: "" });
    setCustomerInvoices([]);
  }

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-product-return">
      <div>
        <h1 className="text-2xl font-bold">Product Return</h1>
        <p className="text-sm text-muted-foreground">Customer returns bottles — adjust stock and ledger</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            Record Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.customerId && <p className="text-xs text-destructive">{form.formState.errors.customerId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" data-testid="input-date" {...form.register("date")} />
              </div>
            </div>

            {customerInvoices.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to Invoice (optional)</Label>
                <Select
                  value={form.watch("invoiceId") ? String(form.watch("invoiceId")) : "none"}
                  onValueChange={(v) => form.setValue("invoiceId", v && v !== "none" ? Number(v) : undefined)}
                >
                  <SelectTrigger data-testid="select-invoice">
                    <SelectValue placeholder="Select invoice (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customerInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={String(inv.id)}>
                        {inv.invoiceNumber} — {format(new Date(inv.date), "dd MMM yy")} — {formatPKR(inv.netAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items Returned</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ bottleSize: "19L", quantity: 1, rate: 0 })} data-testid="button-add-item">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Item
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-7 gap-2 items-center" data-testid={`return-item-${index}`}>
                  <div className="col-span-3">
                    <Select
                      value={form.watch(`items.${index}.bottleSize`)}
                      onValueChange={(v) => form.setValue(`items.${index}.bottleSize`, v as BottleSize)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_SIZES.map((s) => <SelectItem key={s} value={s}>{BOTTLE_LABELS[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min={1} className="h-9 text-sm" placeholder="Qty" {...form.register(`items.${index}.quantity`)} />
                  </div>
                  <div className="col-span-1">
                    <Input type="number" min={0} className="h-9 text-sm" placeholder="Rate" {...form.register(`items.${index}.rate`)} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => remove(index)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="Reason for return..." data-testid="input-notes" {...form.register("notes")} />
            </div>

            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Credit to Customer</span>
              <span className="text-green-600">{formatPKR(totalCredit)}</span>
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Return
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Returns</CardTitle></CardHeader>
        <CardContent>
          {!recent || recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No returns recorded yet.</p>
          ) : (
            <div className="divide-y">
              {recent.map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between text-sm" data-testid={`return-${r.id}`}>
                  <div>
                    <span className="font-medium">{customerMap[r.customerId]?.name || "?"}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{r.items.length} item(s)</span>
                    {r.invoiceId && <span className="text-muted-foreground ml-2 text-xs">(Linked)</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-medium">+{formatPKR(r.totalCredit)}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.date), "dd MMM yy")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
