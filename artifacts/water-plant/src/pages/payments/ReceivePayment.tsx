import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { getCustomerBalance } from "@/lib/calculations";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";

const schema = z.object({
  customerId: z.coerce.number().positive("Select a customer"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export default function ReceivePayment() {
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedCustomer = params.get("customer");

  const customers = useLiveQuery(() => db.customers.orderBy("name").toArray());
  const recent = useLiveQuery(() => db.payments.orderBy("date").reverse().limit(10).toArray());
  const [selectedBalance, setSelectedBalance] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: preselectedCustomer ? Number(preselectedCustomer) : 0,
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const watchedCustomer = form.watch("customerId");

  useEffect(() => {
    if (watchedCustomer) {
      getCustomerBalance(watchedCustomer).then(setSelectedBalance);
    } else {
      setSelectedBalance(null);
    }
  }, [watchedCustomer]);

  async function onSubmit(data: FormData) {
    await db.payments.add({
      customerId: data.customerId,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Payment received", description: `${formatPKR(data.amount)} from customer` });
    form.reset({ customerId: 0, amount: 0, date: new Date().toISOString().slice(0, 10), notes: "" });
    setSelectedBalance(null);
  }

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id!, c]));

  return (
    <div className="max-w-2xl space-y-6" data-testid="page-receive-payment">
      <div>
        <h1 className="text-2xl font-bold">Receive Payment</h1>
        <p className="text-sm text-muted-foreground">Record payment from customer</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Record Payment
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
              {selectedBalance !== null && (
                <p className={`text-xs font-medium ${selectedBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                  Outstanding balance: {formatPKR(selectedBalance)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (Rs.)</Label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  data-testid="input-amount"
                  {...form.register("amount")}
                />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" data-testid="input-date" {...form.register("date")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} placeholder="e.g. partial payment, advance..." data-testid="input-notes" {...form.register("notes")} />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Record Payment
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
        <CardContent>
          {!recent || recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="divide-y">
              {recent.map((p) => (
                <div key={p.id} className="py-2.5 flex justify-between text-sm" data-testid={`payment-${p.id}`}>
                  <div>
                    <span className="font-medium">{customerMap[p.customerId]?.name || "?"}</span>
                    {p.notes && <span className="text-muted-foreground ml-2 text-xs">— {p.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-medium">{formatPKR(p.amount)}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(p.date), "dd MMM yy")}</span>
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
