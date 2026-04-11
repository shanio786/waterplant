import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStockSummary } from "@/lib/calculations";
import type { StockSummary } from "@/lib/types";
import { BOTTLE_LABELS } from "@/lib/types";
import { Package, RefreshCw, ShoppingBag, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export default function StockView() {
  const [stock, setStock] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getStockSummary()
      .then(setStock)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const nonFillingProducts = useLiveQuery(() =>
    db.products.filter((p) => p.isActive && !p.requiresFilling).toArray()
  );
  const fillingProducts = useLiveQuery(() =>
    db.products.filter((p) => p.isActive && p.requiresFilling === true && !!p.bottleSize).toArray()
  );
  const allFillingRecords = useLiveQuery(() => db.fillingRecords.toArray());
  const productStockEntries = useLiveQuery(() => db.productStockEntries.toArray());
  const allInvoices = useLiveQuery(() => db.invoices.toArray());

  const emptyStockEntries = useLiveQuery(() => db.emptyStockEntries.toArray());

  function getFillingProductStock(productId: number) {
    const prod = (fillingProducts || []).find((p) => p.id === productId);
    const size = prod?.bottleSize;

    // Empty received: per-product entries + legacy (no productId, same bottleSize)
    const emptyReceived = (emptyStockEntries || [])
      .filter((e) => e.productId === productId)
      .reduce((s, e) => s + e.quantity, 0);
    const emptyLegacy = size ? (emptyStockEntries || [])
      .filter((e) => !e.productId && e.bottleSize === size)
      .reduce((s, e) => s + e.quantity, 0) : 0;

    const filled = (allFillingRecords || [])
      .filter((r) => r.productId === productId)
      .reduce((s, r) => s + r.quantity, 0);

    const emptyRemaining = Math.max(0, emptyReceived + emptyLegacy - filled);

    const sold = (allInvoices || []).reduce((sum, inv) => {
      return sum + (inv.items || [])
        .filter((item) => item.productId === productId)
        .reduce((s, item) => s + item.quantity, 0);
    }, 0);
    return { filled, sold, balance: Math.max(0, filled - sold), emptyRemaining, prod };
  }

  function getNonFillingStock(productId: number) {
    const stockIn = (productStockEntries || [])
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

  const getStatusBadge = (remaining: number) => {
    if (remaining === 0)
      return <Badge variant="destructive">Out of Stock</Badge>;
    if (remaining < 10)
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          Low
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        Good
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="page-stock-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock View</h1>
          <p className="text-sm text-muted-foreground">
            Tamam products ka current stock dekho
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Filling Products (Bottle Stock) */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Filling Products (Bottles)
        </h2>
        {loading ? (
          <div className="flex justify-center h-32 items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stock.map((s) => (
              <Card key={s.bottleSize} data-testid={`stock-card-${s.bottleSize}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    {BOTTLE_LABELS[s.bottleSize]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Empty Stock</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold">{s.emptyRemaining}</p>
                        {getStatusBadge(s.emptyRemaining)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Received: {s.emptyReceived} | Filled: {s.filled}
                      </p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Full Stock</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-primary">{s.fullRemaining}</p>
                        {getStatusBadge(s.fullRemaining)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Filled: {s.filled} | Sold: {s.fullSold}
                      </p>
                    </div>
                  </div>
                  {s.bottleSize === "19L" && (
                    <p className="text-xs text-muted-foreground">
                      Returns: {s.fullReturned} bottles returned to stock
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Per-Product Full Stock (filling products) */}
      {fillingProducts && fillingProducts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-green-600" />
            Full Stock — Per Product
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold">Product</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold">Bottle</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold">Khaali</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold">Filled</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold">Sold</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold">Full Remaining</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {fillingProducts.map((p) => {
                  const { filled, sold, balance, emptyRemaining } = getFillingProductStock(p.id!);
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2.5 px-3 font-medium">{p.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">
                        {p.bottleSize ? BOTTLE_LABELS[p.bottleSize] : "—"}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${emptyRemaining === 0 ? "text-red-600" : "text-blue-600"}`}>
                        {emptyRemaining}
                      </td>
                      <td className="py-2.5 px-3 text-right">{filled}</td>
                      <td className="py-2.5 px-3 text-right">{sold}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${balance === 0 ? "text-red-600" : balance < 10 ? "text-orange-600" : "text-green-600"}`}>
                        {balance}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {balance === 0 ? (
                          <Badge variant="destructive" className="text-xs">Out</Badge>
                        ) : balance < 10 ? (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">Low</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-xs">OK</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            * Khaali = Empty bottles available per product | Full Remaining = filled - sold
          </p>
        </div>
      )}

      {/* Non-Filling Products Stock */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-purple-600" />
          Non-Filling Products (Juice, Drinks etc.)
        </h2>
        {nonFillingProducts && nonFillingProducts.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Koi non-filling product nahi mila. Products page mein "Requires Filling" OFF karke add karein.
            </CardContent>
          </Card>
        )}
        {nonFillingProducts && nonFillingProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonFillingProducts.map((p) => {
              const { stockIn, sold, balance } = getNonFillingStock(p.id!);
              return (
                <Card key={p.id} data-testid={`nf-stock-card-${p.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                      {p.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-3xl font-bold text-purple-700">{balance}</p>
                        <p className="text-xs text-muted-foreground">
                          Kharida: {stockIn} | Becha: {sold}
                        </p>
                      </div>
                      {balance === 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Out of Stock</span>
                        </div>
                      )}
                      {balance > 0 && balance < 10 && (
                        <Badge className="bg-orange-100 text-orange-700">Low</Badge>
                      )}
                      {balance >= 10 && (
                        <Badge className="bg-green-100 text-green-700">Good</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selling: Rs. {p.sellingPrice} | Unit: {p.unit}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
