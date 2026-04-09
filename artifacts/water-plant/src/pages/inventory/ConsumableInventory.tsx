import { useState } from "react";
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
import type { BottleSize, ConsumableItem } from "@/lib/types";
import { Tag, Package2, Plus } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  item: z.enum(["label", "cap"]),
  bottleSize: z.enum(["500ml", "1.5L", "5L", "19L"]),
  quantity: z.coerce.number().int().positive("Qty positive honi chahiye"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function getBalance(
  entries: { item: string; bottleSize: string; quantity: number }[],
  fillingRecords: { bottleSize: string; productId?: number; quantity: number }[],
  products: { id?: number; bottleSize?: string; labelsPerUnit: number; capsPerUnit: number }[],
  item: ConsumableItem,
  size: BottleSize
) {
  const received = entries
    .filter((e) => e.item === item && e.bottleSize === size)
    .reduce((s, e) => s + e.quantity, 0);

  // Calculate used per filling record (use product-specific perUnit if productId available)
  const fallbackProd = products.find((p) => p.bottleSize === size);
  const used = fillingRecords
    .filter((r) => r.bottleSize === size)
    .reduce((s, r) => {
      const prod = r.productId
        ? (products.find((p) => p.id === r.productId) ?? fallbackProd)
        : fallbackProd;
      const perUnit = item === "label" ? (prod?.labelsPerUnit ?? 1) : (prod?.capsPerUnit ?? 0);
      return s + r.quantity * perUnit;
    }, 0);

  return { received, used, remaining: Math.max(0, received - used) };
}

export default function ConsumableInventory() {
  const { toast } = useToast();
  const [activeItem, setActiveItem] = useState<ConsumableItem>("label");

  const entries = useLiveQuery(() => db.consumableStock.orderBy("date").reverse().toArray());
  const fillingRecords = useLiveQuery(() => db.fillingRecords.toArray());
  const products = useLiveQuery(() => db.products.filter((p) => p.bottleSize !== undefined).toArray());

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      item: "label",
      bottleSize: "19L",
      quantity: 100,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  async function onSubmit(data: FormData) {
    await db.consumableStock.add({
      item: data.item as ConsumableItem,
      bottleSize: data.bottleSize as BottleSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({
      title: `${data.item === "label" ? "Labels" : "Caps"} added`,
      description: `${data.quantity} × ${BOTTLE_LABELS[data.bottleSize as BottleSize]} stock mein add ho gayi`,
    });
    form.reset({ item: data.item, bottleSize: data.bottleSize, quantity: 100, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  const entriesList = entries || [];
  const fillingList = fillingRecords || [];
  const productList = products || [];

  const bottleSizesWithLabels = BOTTLE_SIZES.filter((s) => {
    const prod = productList.find((p) => p.bottleSize === s);
    return prod && (activeItem === "label" ? prod.labelsPerUnit > 0 : prod.capsPerUnit > 0);
  });

  return (
    <div className="max-w-4xl space-y-6" data-testid="page-consumable-inventory">
      <div>
        <h1 className="text-2xl font-bold">Labels &amp; Caps Inventory</h1>
        <p className="text-sm text-muted-foreground">Labels اور Caps کا stock record کریں — filling کے وقت auto-deduct ہوتا ہے</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {BOTTLE_SIZES.map((size) => {
          const lb = getBalance(entriesList, fillingList, productList, "label", size);
          const cp = getBalance(entriesList, fillingList, productList, "cap", size);
          const prod = productList.find((p) => p.bottleSize === size);
          return (
            <Card key={size} className={lb.remaining < 20 || cp.remaining < 20 ? "border-orange-300" : ""}>
              <CardContent className="pt-3 pb-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">{BOTTLE_LABELS[size]}</p>
                {prod && prod.labelsPerUnit > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs flex items-center gap-1"><Tag className="h-3 w-3 text-blue-500" />Labels</span>
                    <Badge variant={lb.remaining < 20 ? "destructive" : "secondary"} className="text-xs">
                      {lb.remaining} left
                    </Badge>
                  </div>
                )}
                {prod && prod.capsPerUnit > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs flex items-center gap-1"><Package2 className="h-3 w-3 text-purple-500" />Caps</span>
                    <Badge variant={cp.remaining < 20 ? "destructive" : "secondary"} className="text-xs">
                      {cp.remaining} left
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add Stock Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Stock Add کریں
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Item Type</Label>
                <Select
                  value={form.watch("item")}
                  onValueChange={(v) => { form.setValue("item", v as ConsumableItem); setActiveItem(v as ConsumableItem); }}
                >
                  <SelectTrigger data-testid="select-item">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Labels (اسٹکر)</SelectItem>
                    <SelectItem value="cap">Caps (ڈھکن)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Bottle Size</Label>
                <Select
                  value={form.watch("bottleSize")}
                  onValueChange={(v) => form.setValue("bottleSize", v as BottleSize)}
                >
                  <SelectTrigger data-testid="select-bottle-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOTTLE_SIZES.map((s) => <SelectItem key={s} value={s}>{BOTTLE_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} data-testid="input-quantity" {...form.register("quantity")} />
                  {form.formState.errors.quantity && <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" data-testid="input-date" {...form.register("date")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea rows={2} placeholder="Supplier name ya koi aur info..." {...form.register("notes")} />
              </div>

              <Button type="submit" className="w-full" data-testid="button-submit">
                Add to Stock
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Detailed balance per size */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {BOTTLE_SIZES.map((size) => {
                const lb = getBalance(entriesList, fillingList, productList, "label", size);
                const cp = getBalance(entriesList, fillingList, productList, "cap", size);
                const prod = productList.find((p) => p.bottleSize === size);
                return (
                  <div key={size} className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-semibold">{BOTTLE_LABELS[size]}</p>
                    {prod && prod.labelsPerUnit > 0 && (
                      <div className="grid grid-cols-3 text-xs gap-1 text-muted-foreground">
                        <span>Labels received: <strong className="text-foreground">{lb.received}</strong></span>
                        <span>Used: <strong className="text-orange-600">{lb.used}</strong></span>
                        <span>Remaining: <strong className={lb.remaining < 20 ? "text-red-600" : "text-green-600"}>{lb.remaining}</strong></span>
                      </div>
                    )}
                    {prod && prod.capsPerUnit > 0 && (
                      <div className="grid grid-cols-3 text-xs gap-1 text-muted-foreground">
                        <span>Caps received: <strong className="text-foreground">{cp.received}</strong></span>
                        <span>Used: <strong className="text-orange-600">{cp.used}</strong></span>
                        <span>Remaining: <strong className={cp.remaining < 20 ? "text-red-600" : "text-green-600"}>{cp.remaining}</strong></span>
                      </div>
                    )}
                    {prod && prod.labelsPerUnit === 0 && prod.capsPerUnit === 0 && (
                      <p className="text-xs text-muted-foreground">Labels/Caps not set for this size — update in Products</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet — add stock above.</p>
          ) : (
            <div className="divide-y">
              {entriesList.slice(0, 20).map((e) => (
                <div key={e.id} className="py-2.5 flex justify-between text-sm" data-testid={`entry-${e.id}`}>
                  <div className="flex items-center gap-2">
                    {e.item === "label" ? <Tag className="h-3.5 w-3.5 text-blue-500" /> : <Package2 className="h-3.5 w-3.5 text-purple-500" />}
                    <span className="font-medium capitalize">{e.item}s</span>
                    <span className="text-muted-foreground">— {BOTTLE_LABELS[e.bottleSize]}</span>
                    {e.notes && <span className="text-xs text-muted-foreground">({e.notes})</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-600">+{e.quantity}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.date), "dd MMM yy")}</span>
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
