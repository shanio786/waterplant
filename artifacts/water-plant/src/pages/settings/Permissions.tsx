import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const PERMS_KEY = "storeManagerPerms";

export type StoreManagerPerms = {
  dashboard: boolean;
  inventory: boolean;
  customers: boolean;
  invoices: boolean;
  returns: boolean;
  payments: boolean;
  expenses: boolean;
  reports: boolean;
};

export const DEFAULT_PERMS: StoreManagerPerms = {
  dashboard: true,
  inventory: true,
  customers: true,
  invoices: true,
  returns: true,
  payments: true,
  expenses: true,
  reports: true,
};

export function loadPerms(): StoreManagerPerms {
  try {
    const raw = localStorage.getItem(PERMS_KEY);
    if (raw) return { ...DEFAULT_PERMS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PERMS };
}

const PERM_LABELS: { key: keyof StoreManagerPerms; label: string; description: string }[] = [
  { key: "dashboard", label: "Dashboard", description: "View daily summary, sales stats and pending customers" },
  { key: "inventory", label: "Inventory", description: "Receive empty bottles, filling process, stock view, labels & caps" },
  { key: "customers", label: "Customers", description: "View, add and edit customer accounts" },
  { key: "invoices", label: "Invoices", description: "Create new invoices and view invoice history" },
  { key: "returns", label: "Returns", description: "Record product returns and can returns" },
  { key: "payments", label: "Payments", description: "Record customer payments" },
  { key: "expenses", label: "Expenses", description: "Add and view expenses" },
  { key: "reports", label: "Reports", description: "View all business reports (Daily, P&L, Stock, Ledger, etc.)" },
];

export default function Permissions() {
  const { toast } = useToast();
  const [perms, setPerms] = useState<StoreManagerPerms>(loadPerms);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof StoreManagerPerms) {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(PERMS_KEY, JSON.stringify(perms));
    setSaved(true);
    toast({ title: "Permissions saved", description: "Store manager access settings updated" });
  }

  function resetToDefault() {
    setPerms({ ...DEFAULT_PERMS });
    setSaved(false);
  }

  const enabledCount = Object.values(perms).filter(Boolean).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store Manager Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Control which sections the Store Manager role can access. Admins and Devs always have full access.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          {enabledCount} of {PERM_LABELS.length} sections enabled
        </Badge>
        <Button variant="ghost" size="sm" onClick={resetToDefault}>Reset to Default</Button>
      </div>

      <div className="space-y-3">
        {PERM_LABELS.map(({ key, label, description }) => (
          <Card key={key} className={`transition-all ${!perms[key] ? "opacity-60" : ""}`}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <Label htmlFor={`perm-${key}`} className="text-sm font-medium cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                id={`perm-${key}`}
                checked={perms[key]}
                onCheckedChange={() => toggle(key)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {saved ? "Saved!" : "Save Permissions"}
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Settings, Products, Users, and Backup &amp; Restore are always restricted to Dev/Admin only regardless of these settings.
            Changes take effect on the store manager's next page load.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
