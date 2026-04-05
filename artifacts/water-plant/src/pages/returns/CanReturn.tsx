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
import { Droplets } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  customerId: z.coerce.number().positive("Select a customer"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CanReturn() {
  const { toast } = useToast();
  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray());
  const recent = useLiveQuery(() => db.canReturns.orderBy("date").reverse().limit(10).toArray());

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: 0,
      quantity: 1,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  async function onSubmit(data: FormData) {
    await db.canReturns.add({
      customerId: data.customerId,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Can return recorded", description: `${data.quantity} × 19L can(s) returned.` });
    form.reset({ customerId: 0, quantity: 1, date: new Date().toISOString().slice(0, 10), notes: "" });
  }

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-can-return">
      <div>
        <h1 className="text-2xl font-bold">19L Can Return</h1>
        <p className="text-sm text-muted-foreground">Track returnable can returns from customers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Record Can Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={String(form.watch("customerId") || "")}
                onValueChange={(v) => form.setValue("customerId", Number(v))}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} — {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && <p className="text-xs text-destructive">{form.formState.errors.customerId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cans Returned (19L)</Label>
                <Input type="number" min={1} data-testid="input-quantity" {...form.register("quantity")} />
                {form.formState.errors.quantity && <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" data-testid="input-date" {...form.register("date")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="Any notes..." data-testid="input-notes" {...form.register("notes")} />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Can Return
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Can Returns</CardTitle></CardHeader>
        <CardContent>
          {!recent || recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No can returns recorded yet.</p>
          ) : (
            <div className="divide-y">
              {recent.map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between text-sm" data-testid={`can-return-${r.id}`}>
                  <div>
                    <span className="font-medium">{customerMap[r.customerId]?.name || "?"}</span>
                    {r.notes && <span className="text-muted-foreground ml-2 text-xs">— {r.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-medium">{r.quantity} cans</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.date), "dd MMM yy")}</span>
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
