import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  FileText,
  Users,
  ArrowRight,
} from "lucide-react";
import { getDashboardSummary } from "@/lib/calculations";
import type { DashboardSummary } from "@/lib/types";
import { BOTTLE_LABELS } from "@/lib/types";

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available. Start by adding products and customers.
      </div>
    );
  }

  const s = summary;
  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button size="sm" data-testid="button-new-invoice">
              <FileText className="h-4 w-4 mr-1.5" />
              New Invoice
            </Button>
          </Link>
          <Link href="/payments">
            <Button size="sm" variant="outline" data-testid="button-receive-payment">
              <DollarSign className="h-4 w-4 mr-1.5" />
              Receive Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-today-sales">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatPKR(s.todaySales)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                Cash: {formatPKR(s.todayCash)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Credit: {formatPKR(s.todayCredit)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-payment-received">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Payments Received
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatPKR(s.todayPaymentsReceived)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-today-expenses">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Today's Expenses
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatPKR(s.todayExpenses)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-receivable">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Receivable
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatPKR(s.totalReceivable)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Stock Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {s.stockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All stock levels are healthy.
              </p>
            ) : (
              <div className="space-y-2">
                {s.stockAlerts.map((alert) => (
                  <div
                    key={alert.bottleSize}
                    className="flex items-center justify-between text-sm"
                    data-testid={`stock-alert-${alert.bottleSize}`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{BOTTLE_LABELS[alert.bottleSize]}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">
                        Empty: {alert.emptyRemaining}
                      </Badge>
                      <Badge variant="secondary">
                        Full: {alert.fullRemaining}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/inventory/stock">
              <Button variant="ghost" size="sm" className="mt-3 w-full" data-testid="button-view-stock">
                View Full Stock <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick actions panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: "Receive Bottles", href: "/inventory/receive", icon: Package },
              { label: "Fill Bottles", href: "/inventory/fill", icon: Package },
              { label: "Product Return", href: "/returns/product", icon: Package },
              { label: "Can Return", href: "/returns/can", icon: Package },
              { label: "Add Expense", href: "/expenses", icon: TrendingDown },
              { label: "View Reports", href: "/reports", icon: TrendingUp },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  data-testid={`button-${action.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {action.label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
