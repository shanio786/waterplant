import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { Download, Upload, AlertTriangle, CheckCircle2, Database, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

const TABLES = [
  "customers",
  "emptyStockEntries",
  "fillingRecords",
  "invoices",
  "payments",
  "productReturns",
  "canReturns",
  "expenses",
  "products",
  "businessSettings",
  "consumableStock",
  "productStockEntries",
] as const;

type BackupData = {
  version: number;
  exportedAt: string;
  appName: string;
  tables: Record<string, unknown[]>;
};

export default function BackupRestore() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreState, setRestoreState] = useState<"idle" | "confirm" | "restoring" | "done">("idle");
  const [pendingData, setPendingData] = useState<BackupData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});

  async function handleExport() {
    setExporting(true);
    try {
      const tables: Record<string, unknown[]> = {};
      for (const table of TABLES) {
        tables[table] = await (db as any)[table].toArray();
      }

      const backup: BackupData = {
        version: 5,
        exportedAt: new Date().toISOString(),
        appName: "WaterPlantManager",
        tables,
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `water-plant-backup-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const totalRecords = Object.values(tables).reduce((s, arr) => s + arr.length, 0);
      toast({
        title: "Backup downloaded!",
        description: `${totalRecords} records — ${TABLES.length} tables exported`,
      });
    } catch (err) {
      toast({ title: "Backup failed", description: String(err), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BackupData;
        if (data.appName !== "WaterPlantManager" || !data.tables) {
          toast({ title: "Invalid backup file", description: "Yeh file is app ka backup nahi lag raha", variant: "destructive" });
          return;
        }
        const countStats: Record<string, number> = {};
        for (const [tbl, rows] of Object.entries(data.tables)) {
          countStats[tbl] = Array.isArray(rows) ? rows.length : 0;
        }
        setStats(countStats);
        setPendingData(data);
        setRestoreState("confirm");
      } catch {
        toast({ title: "File read error", description: "JSON parse nahi ho saki", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function confirmRestore() {
    if (!pendingData) return;
    setRestoreState("restoring");
    try {
      for (const table of TABLES) {
        const rows = pendingData.tables[table];
        if (!Array.isArray(rows)) continue;
        const tbl = (db as any)[table];
        await tbl.clear();
        if (rows.length > 0) {
          await tbl.bulkPut(rows);
        }
      }
      toast({ title: "Restore complete!", description: "All data restored successfully. Refreshing..." });
      setRestoreState("done");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast({ title: "Restore failed", description: String(err), variant: "destructive" });
      setRestoreState("idle");
    }
  }

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-backup-restore">
      <div>
        <h1 className="text-2xl font-bold">Backup &amp; Restore</h1>
        <p className="text-sm text-muted-foreground">Download all data as a JSON backup file or restore from a previous backup</p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-green-600" />
            Download Backup
          </CardTitle>
          <CardDescription>
            All customers, invoices, stock, payments and expenses will be exported as a JSON file. Keep it in a safe location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {TABLES.map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Database className="h-3 w-3" />
                  <span className="capitalize">{t}</span>
                </div>
              ))}
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Download Backup (.json)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card className={restoreState === "confirm" ? "border-orange-300" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-orange-600" />
            Restore from Backup
          </CardTitle>
          <CardDescription>
            Upload a previously downloaded backup file. <strong className="text-destructive">All existing data will be replaced.</strong> Only use when necessary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restoreState === "idle" && (
            <>
              <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Restoring will <strong>delete all current data</strong> and replace it with the backup file contents. Take a fresh backup first if needed.</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file"
              />
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-select-file"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Backup File (.json)
              </Button>
            </>
          )}

          {restoreState === "confirm" && pendingData && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Confirm Restore — Data from:</p>
                  <p className="text-xs mt-0.5">Export date: {format(new Date(pendingData.exportedAt), "dd MMM yyyy hh:mm a")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(stats).map(([tbl, count]) => (
                  <div key={tbl} className="flex justify-between text-xs px-2 py-1 bg-muted rounded">
                    <span className="text-muted-foreground capitalize">{tbl}</span>
                    <span className="font-semibold">{count} records</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setRestoreState("idle"); setPendingData(null); }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmRestore}
                  data-testid="button-confirm-restore"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Yes, Restore Now
                </Button>
              </div>
            </div>
          )}

          {restoreState === "restoring" && (
            <div className="flex items-center gap-3 p-4 text-sm text-primary">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              Restoring data, please wait...
            </div>
          )}

          {restoreState === "done" && (
            <div className="flex items-center gap-2 text-green-700 text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Restore complete! Page will refresh automatically...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
            <div className="space-y-1">
              <p><strong>Best practice:</strong> Take a backup daily — especially after invoicing or payment activity.</p>
              <p><strong>When to restore:</strong> New computer, data loss, or system reset.</p>
              <p><strong>Note:</strong> User accounts and passwords are not included in the backup.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
