import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { ShoppingCart, Plus, Package, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  productId: z.coerce.number().int().positive("Product choose karo"),
  quantity: z.coerce.number().int().positive("Quantity positive honi chahiye"),
  costPrice: z.coerce.number().min(0, "Cost price sahi daro"),
  date: z.string().min(1, "Date zaruri hai"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProductStock() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const nonFillingProducts = useLiveQuery(() =>
    db.products
      .filter((p) => p.isActive && !p.requiresFilling)
      .toArray()
  );

  const allEntries = useLiveQuery(() =>
    db.productStockEntries.orderBy("date").reverse().limit(50).toArray()
  );

  const allInvoices = useLiveQuery(() => db.invoices.toArray());

  function getStockBalance(productId: number): { stockIn: number; sold: number; balance: number } {
    const stockIn = (allEntries || [])
      .filter((e) => e.productId === productId)
      .reduce((s, e) => s + e.quantity, 0);

    const sold = (allInvoices || []).reduce((sum, inv) => {
      const qty = (inv.items || [])
        .filter((item) => item.productId === productId)
        .reduce((s, item) => s + item.quantity, 0);
      return sum + qty;
    }, 0);

    return { stockIn, sold, balance: Math.max(0, stockIn - sold) };
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: 0,
      quantity: 1,
      costPrice: 0,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  async function onSubmit(data: FormData) {
    await db.productStockEntries.add({
      productId: data.productId,
      quantity: data.quantity,
      costPrice: data.costPrice,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    const prod = (nonFillingProducts || []).find((p) => p.id === data.productId);
    toast({
      title: "Stock added",
      description: `${data.quantity} × ${prod?.name || "Product"} stock mein add ho gaya.`,
    });
    form.reset({
      productId: data.productId,
      quantity: 1,
      costPrice: data.costPrice,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }

  const watchedProductId = Number(form.watch("productId"));
  const currentBalance =
    watchedProductId > 0 ? getStockBalance(watchedProductId) : null;

  const recentEntries = (allEntries || []).slice(0, 20);

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-product-stock">
      <div>
        <h1 className="text-2xl font-bold">Product Stock (Non-Filling)</h1>
        <p className="text-sm text-muted-foreground">
          Juice, drinks aur external products ka stock andar daalo
        </p>
      </div>

      {/* Stock Overview */}
      {nonFillingProducts && nonFillingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Current Stock Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {nonFillingProducts.map((p) => {
                const { stockIn, sold, balance } = getStockBalance(p.id!);
                return (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between text-sm"
                    data-testid={`stock-row-${p.id}`}
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Kharida: {stockIn} | Becha: {sold}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{balance}</p>
                      {balance === 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          Out of Stock
                        </div>
                      )}
                      {balance > 0 && balance < 10 && (
                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                          Low Stock
                        </Badge>
                      )}
                      {balance >= 10 && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          OK
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {nonFillingProducts && nonFillingProducts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Koi non-filling product nahi mila. Products page mein jayein aur "Requires Filling" OFF karke product add karein.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Stock Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Stock Andar Daalo (Purchase)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select
                value={String(form.watch("productId") || "")}
                onValueChange={(v) => {
                  form.setValue("productId", Number(v));
                  setSelectedProductId(Number(v));
                  const prod = (nonFillingProducts || []).find(
                    (p) => p.id === Number(v)
                  );
                  if (prod) form.setValue("costPrice", prod.costPrice);
                }}
              >
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Product choose karo..." />
                </SelectTrigger>
                <SelectContent>
                  {(nonFillingProducts || []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.productId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.productId.message}
                </p>
              )}
            </div>

            {/* Current balance info */}
            {currentBalance && (
              <div className="rounded-lg border bg-muted/30 px-4 py-2.5 text-sm flex justify-between">
                <span className="text-muted-foreground">Abhi stock:</span>
                <span className="font-semibold text-primary">
                  {currentBalance.balance} units
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity (units)</Label>
                <Input
                  type="number"
                  min={1}
                  data-testid="input-quantity"
                  {...form.register("quantity")}
                />
                {form.formState.errors.quantity && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (per unit)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  data-testid="input-cost"
                  {...form.register("costPrice")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                data-testid="input-date"
                {...form.register("date")}
              />
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
              <ShoppingCart className="h-4 w-4 mr-2" />
              Stock Add Karo
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Abhi tak koi entry nahi.</p>
          ) : (
            <div className="divide-y">
              {recentEntries.map((e) => {
                const prod = (nonFillingProducts || []).find(
                  (p) => p.id === e.productId
                );
                return (
                  <div
                    key={e.id}
                    className="py-2.5 flex items-center justify-between text-sm"
                    data-testid={`entry-${e.id}`}
                  >
                    <div>
                      <p className="font-medium">{prod?.name || `Product #${e.productId}`}</p>
                      {e.notes && (
                        <p className="text-xs text-muted-foreground">{e.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">+{e.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.date), "dd MMM yyyy")}
                      </p>
                    </div>
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
