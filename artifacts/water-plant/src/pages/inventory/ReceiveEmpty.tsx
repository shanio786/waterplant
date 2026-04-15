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
import { Package, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  productId: z.coerce.number().int().positive("Product choose karo"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ReceiveEmpty() {
  const { toast } = useToast();

  const products = useLiveQuery(() =>
    db.products.filter((p) => p.isActive && p.requiresFilling === true).toArray()
  );
  const entries = useLiveQuery(() =>
    db.emptyStockEntries.orderBy("date").reverse().limit(20).toArray()
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
  const selectedProduct = (products || []).find((p) => p.id === selectedProductId);

  async function deleteEntry(id: number) {
    await db.emptyStockEntries.delete(id);
    toast({ title: "Entry delete ho gai" });
  }

  async function onSubmit(data: FormData) {
    if (!selectedProduct) {
      toast({ title: "Product choose karo", variant: "destructive" });
      return;
    }
    await db.emptyStockEntries.add({
      productId: selectedProduct.id,
      bottleSize: selectedProduct.bottleSize as BottleSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({
      title: "Bottles received",
      description: `${data.quantity} × ${selectedProduct.name} khaali bottles stock mein add ho gayi.`,
    });
    form.reset({ productId: 0, quantity: 1, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  function getProductName(entry: { productId?: number; bottleSize: BottleSize }) {
    if (entry.productId) {
      const p = (products || []).find((x) => x.id === entry.productId);
      if (p) return p.name;
    }
    return BOTTLE_LABELS[entry.bottleSize];
  }

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-receive-empty">
      <div>
        <h1 className="text-2xl font-bold">Receive Empty Bottles</h1>
        <p className="text-sm text-muted-foreground">Product ke hisaab se khaali bottles record karo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
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
                {selectedProduct && (
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {selectedProduct.bottleSize ? BOTTLE_LABELS[selectedProduct.bottleSize] : ""}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
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

            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" data-testid="input-date" {...form.register("date")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Koi note..."
                data-testid="input-notes"
                {...form.register("notes")}
              />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Receipt
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!entries || entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Abhi tak koi entry nahi.</p>
          ) : (
            <div className="divide-y">
              {entries.map((e) => (
                <div key={e.id} className="py-2.5 text-sm" data-testid={`entry-${e.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{getProductName(e)}</span>
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        {BOTTLE_LABELS[e.bottleSize]}
                      </Badge>
                      {e.notes && (
                        <span className="text-muted-foreground ml-2">— {e.notes}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="font-semibold text-primary">+{e.quantity}</span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(e.date), "dd MMM yyyy")}
                      </span>
                      <button
                        onClick={() => deleteEntry(e.id!)}
                        className="text-destructive hover:text-destructive/70 p-1 rounded"
                        title="Delete"
                        data-testid={`button-delete-entry-${e.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
