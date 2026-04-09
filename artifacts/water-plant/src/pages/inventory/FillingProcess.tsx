import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { BOTTLE_SIZES, BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize } from "@/lib/types";
import { Droplets, Tag, Package2, AlertTriangle, Info } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  bottleSize: z.enum(["500ml", "1.5L", "5L", "19L"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FillingProcess() {
  const { toast } = useToast();
  const records = useLiveQuery(() =>
    db.fillingRecords.orderBy("date").reverse().limit(20).toArray()
  );
  const emptyEntries = useLiveQuery(() => db.emptyStockEntries.toArray());
  const allFillingRecords = useLiveQuery(() => db.fillingRecords.toArray());
  const products = useLiveQuery(() =>
    db.products.filter((p) => p.isActive && p.requiresFilling).toArray()
  );
  const consumableStock = useLiveQuery(() => db.consumableStock.toArray());

  function getAvailableEmpty(size: BottleSize) {
    if (!emptyEntries || !allFillingRecords) return 0;
    const received = emptyEntries
      .filter((e) => e.bottleSize === size)
      .reduce((s, e) => s + e.quantity, 0);
    const alreadyFilled = allFillingRecords
      .filter((r) => r.bottleSize === size)
      .reduce((s, r) => s + r.quantity, 0);
    return Math.max(0, received - alreadyFilled);
  }

  function getProductsForSize(size: BottleSize) {
    return (products || []).filter((p) => p.bottleSize === size);
  }

  // For consumable tracking, use first matching product (labels/caps are per product)
  function getProductForSize(size: BottleSize) {
    return (products || []).find((p) => p.bottleSize === size);
  }

  function getConsumableBalance(size: BottleSize, item: "label" | "cap"): number {
    const prod = getProductForSize(size);
    const perUnit = item === "label" ? (prod?.labelsPerUnit ?? 0) : (prod?.capsPerUnit ?? 0);
    const received = (consumableStock || [])
      .filter((e) => e.item === item && e.bottleSize === size)
      .reduce((s, e) => s + e.quantity, 0);
    const used = (allFillingRecords || [])
      .filter((r) => r.bottleSize === size)
      .reduce((s, r) => s + r.quantity * perUnit, 0);
    return Math.max(0, received - used);
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bottleSize: "19L",
      quantity: 1,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  async function onSubmit(data: FormData) {
    const available = getAvailableEmpty(data.bottleSize as BottleSize);
    if (data.quantity > available) {
      toast({
        title: "Insufficient empty stock",
        description: `Sirf ${available} khaali ${BOTTLE_LABELS[data.bottleSize as BottleSize]} available hain.`,
        variant: "destructive",
      });
      return;
    }
    await db.fillingRecords.add({
      bottleSize: data.bottleSize as BottleSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    const prod = getProductForSize(data.bottleSize as BottleSize);
    const labelsUsed = data.quantity * (prod?.labelsPerUnit ?? 0);
    const capsUsed = data.quantity * (prod?.capsPerUnit ?? 0);
    const prods = getProductsForSize(data.bottleSize as BottleSize);
    const prodNames = prods.map((p) => p.name).join(", ");
    let desc = `${data.quantity} × ${BOTTLE_LABELS[data.bottleSize as BottleSize]} fill ho gayi`;
    if (prodNames) desc += ` (${prodNames})`;
    if (labelsUsed > 0) desc += `. ${labelsUsed} labels use hue.`;
    if (capsUsed > 0) desc += ` ${capsUsed} caps use hue.`;
    toast({ title: "Filling recorded", description: desc });
    form.reset({ bottleSize: "19L", quantity: 1, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  const selectedSize = form.watch("bottleSize") as BottleSize;
  const selectedQty = Number(form.watch("quantity")) || 0;
  const prod = getProductForSize(selectedSize);
  const productsForSelected = getProductsForSize(selectedSize);
  const labelsNeeded = selectedQty * (prod?.labelsPerUnit ?? 0);
  const capsNeeded = selectedQty * (prod?.capsPerUnit ?? 0);
  const labelsLeft = getConsumableBalance(selectedSize, "label");
  const capsLeft = getConsumableBalance(selectedSize, "cap");
  const labelShort = labelsNeeded > 0 && labelsLeft < labelsNeeded;
  const capShort = capsNeeded > 0 && capsLeft < capsNeeded;
  const availableEmpty = getAvailableEmpty(selectedSize);

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-filling-process">
      <div>
        <h1 className="text-2xl font-bold">Filling Process</h1>
        <p className="text-sm text-muted-foreground">Khaali bottles fill karo — labels/caps bhi track honge</p>
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
                <Label>Bottle Type</Label>
                <Select
                  value={form.watch("bottleSize")}
                  onValueChange={(v) => form.setValue("bottleSize", v as BottleSize)}
                >
                  <SelectTrigger data-testid="select-bottle-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOTTLE_SIZES.map((size) => {
                      const prods = getProductsForSize(size);
                      return (
                        <SelectItem key={size} value={size}>
                          <div className="flex flex-col">
                            <span>{BOTTLE_LABELS[size]}</span>
                            {prods.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {prods.map((p) => p.name).join(", ")}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Show products for selected size */}
                {productsForSelected.length > 0 && (
                  <div className="flex items-start gap-1.5 rounded-md bg-blue-50 border border-blue-100 px-2.5 py-2 text-xs text-blue-700">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Products yahan fill ho rahe hain:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {productsForSelected.map((p) => (
                          <Badge
                            key={p.id}
                            className="bg-blue-100 text-blue-700 text-xs font-normal"
                          >
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Khaali available:{" "}
                  <strong className={availableEmpty === 0 ? "text-red-600" : "text-green-600"}>
                    {availableEmpty}
                  </strong>
                </p>
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

            {/* Labels & Caps preview */}
            {selectedQty > 0 && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {selectedQty} botol ke liye darkar:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {labelsNeeded > 0 && (
                    <div
                      className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                        labelShort
                          ? "bg-red-50 border border-red-200"
                          : "bg-blue-50 border border-blue-100"
                      }`}
                    >
                      <Tag
                        className={`h-4 w-4 shrink-0 ${labelShort ? "text-red-500" : "text-blue-500"}`}
                      />
                      <div>
                        <p className="font-semibold">{labelsNeeded} Labels</p>
                        <p
                          className={`text-xs ${labelShort ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          {labelShort ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sirf {labelsLeft} available
                            </span>
                          ) : (
                            `${labelsLeft} available`
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {capsNeeded > 0 && (
                    <div
                      className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                        capShort
                          ? "bg-red-50 border border-red-200"
                          : "bg-purple-50 border border-purple-100"
                      }`}
                    >
                      <Package2
                        className={`h-4 w-4 shrink-0 ${capShort ? "text-red-500" : "text-purple-500"}`}
                      />
                      <div>
                        <p className="font-semibold">{capsNeeded} Caps</p>
                        <p
                          className={`text-xs ${capShort ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          {capShort ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sirf {capsLeft} available
                            </span>
                          ) : (
                            `${capsLeft} available`
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {labelsNeeded === 0 && capsNeeded === 0 && (
                    <p className="text-xs text-muted-foreground col-span-2">
                      Labels/Caps configure nahi hain — Products page mein update karein
                    </p>
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
              <Textarea
                rows={2}
                placeholder="Koi note..."
                data-testid="input-notes"
                {...form.register("notes")}
              />
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
                const p = getProductForSize(r.bottleSize);
                const prods = getProductsForSize(r.bottleSize);
                const lblUsed = r.quantity * (p?.labelsPerUnit ?? 0);
                const capUsed = r.quantity * (p?.capsPerUnit ?? 0);
                return (
                  <div key={r.id} className="py-2.5 text-sm" data-testid={`record-${r.id}`}>
                    <div className="flex justify-between">
                      <div>
                        <span className="font-medium">{BOTTLE_LABELS[r.bottleSize]}</span>
                        {prods.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({prods.map((x) => x.name).join(", ")})
                          </span>
                        )}
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
                      <div className="flex gap-3 mt-1 ml-0.5">
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
