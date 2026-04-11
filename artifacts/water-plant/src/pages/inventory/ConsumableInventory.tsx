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
import { BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize, ConsumableItem } from "@/lib/types";
import { Tag, Package2, Plus } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  item: z.enum(["label", "cap"]),
  productId: z.coerce.number().int().positive("Product choose karo"),
  quantity: z.coerce.number().int().positive("Qty positive honi chahiye"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ConsumableInventory() {
  const { toast } = useToast();
  const [activeItem, setActiveItem] = useState<ConsumableItem>("label");

  const entries = useLiveQuery(() => db.consumableStock.orderBy("date").reverse().toArray());
  const fillingRecords = useLiveQuery(() => db.fillingRecords.toArray());
  const products = useLiveQuery(() =>
    db.products.filter((p) => p.isActive && p.requiresFilling === true && !!p.bottleSize).toArray()
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      item: "label",
      productId: 0,
      quantity: 100,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const selectedProductId = Number(form.watch("productId")) || 0;
  const selectedProduct = (products || []).find((p) => p.id === selectedProductId);

  async function onSubmit(data: FormData) {
    if (!selectedProduct) {
      toast({ title: "Product choose karo", variant: "destructive" });
      return;
    }
    await db.consumableStock.add({
      productId: selectedProduct.id,
      item: data.item as ConsumableItem,
      bottleSize: selectedProduct.bottleSize as BottleSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({
      title: `${data.item === "label" ? "Labels" : "Caps"} added`,
      description: `${data.quantity} × ${selectedProduct.name} ke liye stock mein add ho gayi`,
    });
    form.reset({
      item: data.item,
      productId: 0,
      quantity: 100,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }

  const entriesList = entries || [];
  const fillingList = fillingRecords || [];
  const productList = products || [];

  function getProductBalance(productId: number, item: ConsumableItem) {
    const prod = productList.find((p) => p.id === productId);
    if (!prod) return { received: 0, used: 0, remaining: 0 };

    const received = entriesList
      .filter((e) => e.item === item && e.productId === productId)
      .reduce((s, e) => s + e.quantity, 0);

    const perUnit = item === "label" ? (prod.labelsPerUnit ?? 1) : (prod.capsPerUnit ?? 0);
    const used = fillingList
      .filter((r) => r.productId === productId)
      .reduce((s, r) => s + r.quantity * perUnit, 0);

    return { received, used, remaining: Math.max(0, received - used) };
  }

  function getEntryProductName(entry: { productId?: number; bottleSize: BottleSize }) {
    if (entry.productId) {
      const p = productList.find((x) => x.id === entry.productId);
      if (p) return p.name;
    }
    return BOTTLE_LABELS[entry.bottleSize];
  }

  const filteredProducts = productList.filter((p) =>
    activeItem === "label" ? (p.labelsPerUnit ?? 0) > 0 : (p.capsPerUnit ?? 0) > 0
  );

  return (
    <div className="max-w-4xl space-y-6" data-testid="page-consumable-inventory">
      <div>
        <h1 className="text-2xl font-bold">Labels &amp; Caps Inventory</h1>
        <p className="text-sm text-muted-foreground">Product ke hisaab se Labels aur Caps ka stock — filling ke waqt auto-deduct hota hai</p>
      </div>

      {/* Summary Cards — per product */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {productList.map((p) => {
          const lb = getProductBalance(p.id!, "label");
          const cp = getProductBalance(p.id!, "cap");
          const lowLabel = lb.remaining < 20 && p.labelsPerUnit > 0;
          const lowCap = cp.remaining < 20 && p.capsPerUnit > 0;
          return (
            <Card key={p.id} className={lowLabel || lowCap ? "border-orange-300" : ""}>
              <CardContent className="pt-3 pb-3 space-y-1.5">
                <p className="text-xs font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.bottleSize ? BOTTLE_LABELS[p.bottleSize] : ""}</p>
                {p.labelsPerUnit > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs flex items-center gap-1">
                      <Tag className="h-3 w-3 text-blue-500" />Labels
                    </span>
                    <Badge variant={lb.remaining < 20 ? "destructive" : "secondary"} className="text-xs">
                      {lb.remaining} left
                    </Badge>
                  </div>
                )}
                {p.capsPerUnit > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs flex items-center gap-1">
                      <Package2 className="h-3 w-3 text-purple-500" />Caps
                    </span>
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
              Stock Add Karo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Item Type</Label>
                <Select
                  value={form.watch("item")}
                  onValueChange={(v) => {
                    form.setValue("item", v as ConsumableItem);
                    setActiveItem(v as ConsumableItem);
                  }}
                >
                  <SelectTrigger data-testid="select-item">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Labels (Sticker)</SelectItem>
                    <SelectItem value="cap">Caps (Dhakna)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Product <span className="text-destructive">*</span></Label>
                <Select
                  value={selectedProductId > 0 ? String(selectedProductId) : ""}
                  onValueChange={(v) => form.setValue("productId", Number(v))}
                >
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Product choose karo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.length === 0 && (
                      <SelectItem value="0" disabled>
                        Koi product nahi mila
                      </SelectItem>
                    )}
                    {filteredProducts.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          {p.bottleSize && (
                            <span className="text-xs text-muted-foreground">
                              {BOTTLE_LABELS[p.bottleSize]} — {activeItem === "label" ? p.labelsPerUnit : p.capsPerUnit} per bottle
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.productId && (
                  <p className="text-xs text-destructive">{form.formState.errors.productId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} data-testid="input-quantity" {...form.register("quantity")} />
                  {form.formState.errors.quantity && (
                    <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
                  )}
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

        {/* Balance Summary per product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productList.map((p) => {
                const lb = getProductBalance(p.id!, "label");
                const cp = getProductBalance(p.id!, "cap");
                return (
                  <div key={p.id} className="border rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.bottleSize ? BOTTLE_LABELS[p.bottleSize] : ""}</p>
                    </div>
                    {p.labelsPerUnit > 0 && (
                      <div className="grid grid-cols-3 text-xs gap-1 text-muted-foreground">
                        <span>Labels received: <strong className="text-foreground">{lb.received}</strong></span>
                        <span>Used: <strong className="text-orange-600">{lb.used}</strong></span>
                        <span>Remaining: <strong className={lb.remaining < 20 ? "text-red-600" : "text-green-600"}>{lb.remaining}</strong></span>
                      </div>
                    )}
                    {p.capsPerUnit > 0 && (
                      <div className="grid grid-cols-3 text-xs gap-1 text-muted-foreground">
                        <span>Caps received: <strong className="text-foreground">{cp.received}</strong></span>
                        <span>Used: <strong className="text-orange-600">{cp.used}</strong></span>
                        <span>Remaining: <strong className={cp.remaining < 20 ? "text-red-600" : "text-green-600"}>{cp.remaining}</strong></span>
                      </div>
                    )}
                    {p.labelsPerUnit === 0 && p.capsPerUnit === 0 && (
                      <p className="text-xs text-muted-foreground">Labels/Caps set nahi — Products mein update karo</p>
                    )}
                  </div>
                );
              })}
              {productList.length === 0 && (
                <p className="text-sm text-muted-foreground">Koi filling product nahi mila.</p>
              )}
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
            <p className="text-sm text-muted-foreground">Abhi tak koi entry nahi.</p>
          ) : (
            <div className="divide-y">
              {entriesList.slice(0, 20).map((e) => (
                <div key={e.id} className="py-2.5 flex justify-between text-sm" data-testid={`entry-${e.id}`}>
                  <div className="flex items-center gap-2">
                    {e.item === "label"
                      ? <Tag className="h-3.5 w-3.5 text-blue-500" />
                      : <Package2 className="h-3.5 w-3.5 text-purple-500" />}
                    <span className="font-medium capitalize">{e.item}s</span>
                    <span className="text-muted-foreground">— {getEntryProductName(e)}</span>
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
