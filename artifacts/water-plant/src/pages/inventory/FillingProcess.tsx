import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize } from "@/lib/types";
import { Droplets, Tag, Package2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  productId: z.coerce.number().int().positive("Product choose karo"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FillingProcess() {
  const { toast } = useToast();

  const products = useLiveQuery(() =>
    db.products.filter((p) => p.isActive && p.requiresFilling === true).toArray()
  );
  const emptyEntries = useLiveQuery(() => db.emptyStockEntries.toArray());
  const allFillingRecords = useLiveQuery(() => db.fillingRecords.toArray());
  const consumableStock = useLiveQuery(() => db.consumableStock.toArray());
  const records = useLiveQuery(() =>
    db.fillingRecords.orderBy("date").reverse().limit(20).toArray()
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: 0,
      quantity: 1,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const selectedProductId = Number(form.watch("productId")) || 0;
  const selectedQty = Number(form.watch("quantity")) || 0;

  const selectedProduct = (products || []).find((p) => p.id === selectedProductId);
  const selectedSize = selectedProduct?.bottleSize as BottleSize | undefined;

  function getAvailableEmpty(productId: number, size: BottleSize) {
    if (!emptyEntries || !allFillingRecords) return 0;
    // Per-product: entries with this productId
    const perProductReceived = emptyEntries
      .filter((e) => e.productId === productId)
      .reduce((s, e) => s + e.quantity, 0);
    // Legacy: entries with no productId but same bottleSize
    const legacyReceived = emptyEntries
      .filter((e) => !e.productId && e.bottleSize === size)
      .reduce((s, e) => s + e.quantity, 0);
    const received = perProductReceived + legacyReceived;

    const alreadyFilled = allFillingRecords
      .filter((r) => r.productId === productId)
      .reduce((s, r) => s + r.quantity, 0);
    return Math.max(0, received - alreadyFilled);
  }

  function getConsumableBalance(productId: number, size: BottleSize, item: "label" | "cap", perUnit: number): number {
    // Per-product entries
    const received = (consumableStock || [])
      .filter((e) => e.item === item && e.productId === productId)
      .reduce((s, e) => s + e.quantity, 0);
    // Legacy: entries with no productId but same bottleSize
    const legacyReceived = (consumableStock || [])
      .filter((e) => e.item === item && !e.productId && e.bottleSize === size)
      .reduce((s, e) => s + e.quantity, 0);
    const used = (allFillingRecords || [])
      .filter((r) => r.productId === productId)
      .reduce((s, r) => s + r.quantity * perUnit, 0);
    return Math.max(0, received + legacyReceived - used);
  }

  const labelsNeeded = selectedProduct ? selectedQty * (selectedProduct.labelsPerUnit ?? 0) : 0;
  const capsNeeded = selectedProduct ? selectedQty * (selectedProduct.capsPerUnit ?? 0) : 0;
  const labelsLeft = selectedProduct && selectedSize && selectedProductId
    ? getConsumableBalance(selectedProductId, selectedSize, "label", selectedProduct.labelsPerUnit ?? 0)
    : 0;
  const capsLeft = selectedProduct && selectedSize && selectedProductId
    ? getConsumableBalance(selectedProductId, selectedSize, "cap", selectedProduct.capsPerUnit ?? 0)
    : 0;
  const labelShort = labelsNeeded > 0 && labelsLeft < labelsNeeded;
  const capShort = capsNeeded > 0 && capsLeft < capsNeeded;
  const availableEmpty = selectedProduct && selectedSize && selectedProductId
    ? getAvailableEmpty(selectedProductId, selectedSize)
    : 0;

  function getProductName(productId?: number, bottleSize?: BottleSize) {
    if (productId) {
      const p = (products || []).find((x) => x.id === productId);
      if (p) return p.name;
    }
    if (bottleSize) return BOTTLE_LABELS[bottleSize];
    return "Unknown";
  }

  async function onSubmit(data: FormData) {
    if (!selectedProduct || !selectedSize) {
      toast({ title: "Product choose karo", variant: "destructive" });
      return;
    }
    if (data.quantity > availableEmpty) {
      toast({
        title: "Insufficient empty stock",
        description: `Sirf ${availableEmpty} khaali ${BOTTLE_LABELS[selectedSize]} available hain.`,
        variant: "destructive",
      });
      return;
    }
    await db.fillingRecords.add({
      productId: selectedProduct.id,
      bottleSize: selectedSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    const labelsUsed = data.quantity * (selectedProduct.labelsPerUnit ?? 0);
    const capsUsed = data.quantity * (selectedProduct.capsPerUnit ?? 0);
    let desc = `${data.quantity} × ${selectedProduct.name} (${BOTTLE_LABELS[selectedSize]}) fill ho gayi`;
    if (labelsUsed > 0) desc += `. ${labelsUsed} labels use hue.`;
    if (capsUsed > 0) desc += ` ${capsUsed} caps use hue.`;
    toast({ title: "Filling recorded", description: desc });
    form.reset({ productId: 0, quantity: 1, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-filling-process">
      <div>
        <h1 className="text-2xl font-bold">Filling Process</h1>
        <p className="text-sm text-muted-foreground">Product choose karo aur fill karo — labels/caps bhi track honge</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Record Filling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Product <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  options={(products || []).map((p) => ({
                    value: String(p.id),
                    label: p.name,
                    sub: p.bottleSize ? BOTTLE_LABELS[p.bottleSize] : undefined,
                  }))}
                  value={selectedProductId > 0 ? String(selectedProductId) : ""}
                  onChange={(v) => form.setValue("productId", Number(v))}
                  placeholder="Product choose karo..."
                  searchPlaceholder="Search product..."
                  data-testid="select-product"
                />
                {form.formState.errors.productId && (
                  <p className="text-xs text-destructive">{form.formState.errors.productId.message}</p>
                )}

                {selectedProduct && selectedSize && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>Bottle size: <strong>{BOTTLE_LABELS[selectedSize]}</strong></p>
                    <p>Khaali available:{" "}
                      <strong className={availableEmpty === 0 ? "text-red-600" : "text-green-600"}>
                        {availableEmpty}
                      </strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Quantity to Fill</Label>
                <Input
                  type="number"
                  min={1}
                  data-testid="input-quantity"
                  {...form.register("quantity")}
                />
                {form.formState.errors.quantity && (
                  <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
                )}
              </div>
            </div>

            {selectedProduct && selectedQty > 0 && (labelsNeeded > 0 || capsNeeded > 0) && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {selectedQty} botol ke liye darkar:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {labelsNeeded > 0 && (
                    <div className={`flex items-center gap-2 rounded-md p-2 text-sm ${labelShort ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-100"}`}>
                      <Tag className={`h-4 w-4 shrink-0 ${labelShort ? "text-red-500" : "text-blue-500"}`} />
                      <div>
                        <p className="font-semibold">{labelsNeeded} Labels</p>
                        <p className={`text-xs ${labelShort ? "text-red-600" : "text-muted-foreground"}`}>
                          {labelShort ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sirf {labelsLeft} available
                            </span>
                          ) : `${labelsLeft} available`}
                        </p>
                      </div>
                    </div>
                  )}
                  {capsNeeded > 0 && (
                    <div className={`flex items-center gap-2 rounded-md p-2 text-sm ${capShort ? "bg-red-50 border border-red-200" : "bg-purple-50 border border-purple-100"}`}>
                      <Package2 className={`h-4 w-4 shrink-0 ${capShort ? "text-red-500" : "text-purple-500"}`} />
                      <div>
                        <p className="font-semibold">{capsNeeded} Caps</p>
                        <p className={`text-xs ${capShort ? "text-red-600" : "text-muted-foreground"}`}>
                          {capShort ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sirf {capsLeft} available
                            </span>
                          ) : `${capsLeft} available`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" data-testid="input-date" {...form.register("date")} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="Koi note..." data-testid="input-notes" {...form.register("notes")} />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Filling
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Filling Records</CardTitle>
        </CardHeader>
        <CardContent>
          {!records || records.length === 0 ? (
            <p className="text-sm text-muted-foreground">Abhi tak koi filling record nahi.</p>
          ) : (
            <div className="divide-y">
              {records.map((r) => {
                const prod = (products || []).find((p) => p.id === r.productId);
                const lblUsed = r.quantity * (prod?.labelsPerUnit ?? 0);
                const capUsed = r.quantity * (prod?.capsPerUnit ?? 0);
                const displayName = getProductName(r.productId, r.bottleSize);
                return (
                  <div key={r.id} className="py-2.5 text-sm" data-testid={`record-${r.id}`}>
                    <div className="flex justify-between">
                      <div>
                        <span className="font-medium">{displayName}</span>
                        <Badge variant="outline" className="ml-2 text-xs font-normal">
                          {BOTTLE_LABELS[r.bottleSize]}
                        </Badge>
                        {r.notes && (
                          <span className="text-muted-foreground ml-2">— {r.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-600">+{r.quantity} filled</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(r.date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    {(lblUsed > 0 || capUsed > 0) && (
                      <div className="flex gap-3 mt-1">
                        {lblUsed > 0 && (
                          <Badge variant="secondary" className="text-xs font-normal gap-1">
                            <Tag className="h-3 w-3 text-blue-500" />
                            {lblUsed} labels
                          </Badge>
                        )}
                        {capUsed > 0 && (
                          <Badge variant="secondary" className="text-xs font-normal gap-1">
                            <Package2 className="h-3 w-3 text-purple-500" />
                            {capUsed} caps
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
