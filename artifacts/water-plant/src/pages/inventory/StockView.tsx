import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStockSummary } from "@/lib/calculations";
import type { StockSummary } from "@/lib/types";
import { BOTTLE_LABELS } from "@/lib/types";
import { Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const getStatusBadge = (remaining: number, type: "empty" | "full") => {
    if (remaining === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (remaining < 10) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Low</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Good</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="page-stock-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock View</h1>
          <p className="text-sm text-muted-foreground">Current inventory levels by bottle type</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

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
                      {getStatusBadge(s.emptyRemaining, "empty")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Received: {s.emptyReceived} | Filled: {s.filled}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Full Stock</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-primary">{s.fullRemaining}</p>
                      {getStatusBadge(s.fullRemaining, "full")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Filled: {s.filled} | Sold: {s.fullSold}</p>
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
  );
}
