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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/db";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { Product, ProductCategory } from "@/lib/types";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Product name required"),
  unit: z.string().min(1, "Unit required"),
  sellingPrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  labelsPerUnit: z.coerce.number().int().min(0),
  capsPerUnit: z.coerce.number().int().min(0),
  category: z.enum(["water_bottle", "beverage", "other"]),
});

type FormData = z.infer<typeof schema>;

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

const categoryColors: Record<ProductCategory, string> = {
  water_bottle: "bg-blue-100 text-blue-700",
  beverage: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
};

export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), []);

  const canEdit = user?.role === "dev" || user?.role === "admin";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", unit: "", sellingPrice: 0, costPrice: 0,
      labelsPerUnit: 1, capsPerUnit: 1, category: "water_bottle",
    },
  });

  function openAdd() {
    setEditProduct(null);
    form.reset({
      name: "", unit: "", sellingPrice: 0, costPrice: 0,
      labelsPerUnit: 1, capsPerUnit: 1, category: "water_bottle",
    });
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    form.reset({
      name: p.name, unit: p.unit, sellingPrice: p.sellingPrice,
      costPrice: p.costPrice, labelsPerUnit: p.labelsPerUnit,
      capsPerUnit: p.capsPerUnit, category: p.category,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: FormData) {
    if (editProduct) {
      await db.products.update(editProduct.id!, { ...data, category: data.category as ProductCategory });
      toast({ title: "Product updated" });
    } else {
      await db.products.add({
        ...data,
        category: data.category as ProductCategory,
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Product added", description: data.name });
    }
    setDialogOpen(false);
  }

  async function toggleActive(p: Product) {
    await db.products.update(p.id!, { isActive: !p.isActive });
  }

  async function deleteProduct(p: Product) {
    if (p.isDefault) {
      toast({ title: "Cannot delete default product", variant: "destructive" });
      return;
    }
    await db.products.delete(p.id!);
    toast({ title: "Product deleted" });
  }

  return (
    <div className="space-y-6" data-testid="page-products">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage product catalog with prices</p>
        </div>
        {canEdit && (
          <Button onClick={openAdd} data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Button>
        )}
      </div>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-2 opacity-40" />
            <p>No products yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => {
            const profit = p.sellingPrice - p.costPrice;
            const margin = p.sellingPrice > 0 ? ((profit / p.sellingPrice) * 100).toFixed(0) : 0;
            return (
              <Card key={p.id} className={!p.isActive ? "opacity-50" : ""} data-testid={`product-${p.id}`}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{p.name}</p>
                        {p.isDefault && (
                          <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
                        )}
                      </div>
                      <Badge className={`text-xs ${categoryColors[p.category]}`} variant="secondary">
                        {PRODUCT_CATEGORIES.find((c) => c.value === p.category)?.label}
                      </Badge>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Unit: <strong className="text-foreground">{p.unit}</strong></span>
                        <span>Sell: <strong className="text-green-600">{formatPKR(p.sellingPrice)}</strong></span>
                        <span>Labels: <strong className="text-foreground">{p.labelsPerUnit}/unit</strong></span>
                        <span>Cost: <strong className="text-orange-600">{formatPKR(p.costPrice)}</strong></span>
                        <span>Caps: <strong className="text-foreground">{p.capsPerUnit}/unit</strong></span>
                        <span>Margin: <strong className={profit >= 0 ? "text-green-600" : "text-destructive"}>{margin}%</strong></span>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!p.isDefault && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProduct(p)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <Switch checked={p.isActive} onCheckedChange={() => toggleActive(p)} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input placeholder="e.g. Nesta 500ml, Mango Juice" {...form.register("name")} data-testid="input-name" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unit / Size</Label>
                <Input placeholder="e.g. 500ml, 1L, piece" {...form.register("unit")} data-testid="input-unit" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as ProductCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Selling Price (Rs.)</Label>
                <Input type="number" min={0} step="0.01" {...form.register("sellingPrice")} data-testid="input-selling-price" />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (Rs.)</Label>
                <Input type="number" min={0} step="0.01" {...form.register("costPrice")} data-testid="input-cost-price" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Labels per Unit</Label>
                <Input type="number" min={0} step="1" {...form.register("labelsPerUnit")} data-testid="input-labels" />
              </div>
              <div className="space-y-1.5">
                <Label>Caps per Unit</Label>
                <Input type="number" min={0} step="1" {...form.register("capsPerUnit")} data-testid="input-caps" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" data-testid="button-save-product">
                {editProduct ? "Update" : "Add Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
