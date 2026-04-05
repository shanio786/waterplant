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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { ExpenseCategory } from "@/lib/types";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  category: z.enum(["Salary", "Rent", "Electricity", "Fuel", "Maintenance", "Other"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

function formatPKR(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

const categoryColors: Record<ExpenseCategory, string> = {
  Salary: "bg-blue-100 text-blue-700",
  Rent: "bg-purple-100 text-purple-700",
  Electricity: "bg-yellow-100 text-yellow-700",
  Fuel: "bg-orange-100 text-orange-700",
  Maintenance: "bg-red-100 text-red-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function Expenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const { toast } = useToast();

  const expenses = useLiveQuery(() =>
    db.expenses.orderBy("date").reverse().toArray()
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "Other",
      amount: 0,
      description: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  async function onSubmit(data: FormData) {
    await db.expenses.add({ ...data, category: data.category as ExpenseCategory, createdAt: new Date().toISOString() });
    toast({ title: "Expense recorded", description: `${data.category} — ${formatPKR(data.amount)}` });
    form.reset({ category: "Other", amount: 0, description: "", date: new Date().toISOString().slice(0, 10) });
    setDialogOpen(false);
  }

  async function deleteExpense(id: number) {
    await db.expenses.delete(id);
    toast({ title: "Expense deleted" });
  }

  const filtered = (expenses || []).filter((e) =>
    !filter || e.date === filter
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6" data-testid="page-expenses">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track business expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(v) => form.setValue("category", v as ExpenseCategory)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (Rs.)</Label>
                <Input type="number" min={1} step="0.01" data-testid="input-amount" {...form.register("amount")} />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="What was this expense for?" data-testid="input-description" {...form.register("description")} />
                {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" data-testid="input-date" {...form.register("date")} />
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-expense">
                Save Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by date */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input type="date" value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="input-filter-date" />
        </div>
        {filter && (
          <Button variant="ghost" onClick={() => setFilter("")} size="sm">Clear</Button>
        )}
        <div className="text-sm font-semibold text-right">
          Total: <span className="text-destructive">{formatPKR(total)}</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <DollarSign className="h-10 w-10 mb-2 opacity-40" />
              <p>No expenses recorded</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} data-testid={`expense-${e.id}`}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs ${categoryColors[e.category]}`} variant="secondary">
                    {e.category}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(e.date), "dd MMM yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-destructive text-sm">{formatPKR(e.amount)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteExpense(e.id!)} data-testid={`button-delete-${e.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
