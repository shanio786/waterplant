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
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { BOTTLE_SIZES, BOTTLE_LABELS } from "@/lib/types";
import type { BottleSize } from "@/lib/types";
import { Package, Plus } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  bottleSize: z.enum(["500ml", "1.5L", "5L", "19L"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ReceiveEmpty() {
  const { toast } = useToast();
  const entries = useLiveQuery(() =>
    db.emptyStockEntries.orderBy("date").reverse().limit(20).toArray()
  );

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
    await db.emptyStockEntries.add({
      bottleSize: data.bottleSize as BottleSize,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Bottles received", description: `${data.quantity} × ${BOTTLE_LABELS[data.bottleSize as BottleSize]} added to empty stock.` });
    form.reset({ bottleSize: "19L", quantity: 1, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-receive-empty">
      <div>
        <h1 className="text-2xl font-bold">Receive Empty Bottles</h1>
        <p className="text-sm text-muted-foreground">Record incoming empty bottles by type</p>
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
                <Label htmlFor="bottleSize">Bottle Type</Label>
                <Select
                  value={form.watch("bottleSize")}
                  onValueChange={(v) => form.setValue("bottleSize", v as BottleSize)}
                >
                  <SelectTrigger id="bottleSize" data-testid="select-bottle-size">
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
              <Textarea id="notes" rows={2} placeholder="Any notes..." data-testid="input-notes" {...form.register("notes")} />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Receipt
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!entries || entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <div className="divide-y">
              {entries.map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-sm" data-testid={`entry-${e.id}`}>
                  <div>
                    <span className="font-medium">{BOTTLE_LABELS[e.bottleSize]}</span>
                    {e.notes && <span className="text-muted-foreground ml-2">— {e.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-semibold text-primary">+{e.quantity}</span>
                    <span className="text-muted-foreground text-xs">{format(new Date(e.date), "dd MMM yyyy")}</span>
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
