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
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { BOTTLE_SIZES, BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize } from "@/lib/types";
import { Droplets } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  bottleSize: z.enum(["500ml", "1.5L", "5L", "19L"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FillingProcess() {
  const { toast } = useToast();
  const records = useLiveQuery(() =>
    db.fillingRecords.orderBy("date").reverse().limit(20).toArray()
  );
  const emptyEntries = useLiveQuery(() => db.emptyStockEntries.toArray());

  function getAvailableEmpty(size: BottleSize) {
    if (!emptyEntries) return 0;
    const received = emptyEntries
      .filter((e) => e.bottleSize === size)
      .reduce((s, e) => s + e.quantity, 0);
    return received;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bottleSize: "19L",
      quantity: 1,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  async function onSubmit(data: FormData) {
    const available = getAvailableEmpty(data.bottleSize as BottleSize);
    if (data.quantity > available) {
      toast({ title: "Not enough empty stock", description: `Only ${available} empty ${BOTTLE_LABELS[data.bottleSize as BottleSize]} available.`, variant: "destructive" });
      return;
    }
    await db.fillingRecords.add({
      bottleSize: data.bottleSize as BottleSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Filling recorded", description: `${data.quantity} × ${BOTTLE_LABELS[data.bottleSize as BottleSize]} filled.` });
    form.reset({ bottleSize: "19L", quantity: 1, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  const selectedSize = form.watch("bottleSize") as BottleSize;

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-filling-process">
      <div>
        <h1 className="text-2xl font-bold">Filling Process</h1>
        <p className="text-sm text-muted-foreground">Convert empty bottles to full bottles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Record Filling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Bottle Type</Label>
                <Select
                  value={form.watch("bottleSize")}
                  onValueChange={(v) => form.setValue("bottleSize", v as BottleSize)}
                >
                  <SelectTrigger data-testid="select-bottle-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOTTLE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {BOTTLE_LABELS[size]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Empty available: {getAvailableEmpty(selectedSize)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity to Fill</Label>
                <Input
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
              <Label>Date</Label>
              <Input type="date" data-testid="input-date" {...form.register("date")} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="Any notes..." data-testid="input-notes" {...form.register("notes")} />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Filling
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Filling Records</CardTitle>
        </CardHeader>
        <CardContent>
          {!records || records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No filling records yet.</p>
          ) : (
            <div className="divide-y">
              {records.map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between text-sm" data-testid={`record-${r.id}`}>
                  <div>
                    <span className="font-medium">{BOTTLE_LABELS[r.bottleSize]}</span>
                    {r.notes && <span className="text-muted-foreground ml-2">— {r.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-600">+{r.quantity} filled</span>
                    <span className="text-muted-foreground text-xs">{format(new Date(r.date), "dd MMM yyyy")}</span>
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
