import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { Users, Plus, Search, ArrowRight, Phone, MapPin } from "lucide-react";
import type { Customer } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

type FormData = z.infer<typeof schema>;

function CustomerForm({ onSuccess, defaultValues, customerId }: {
  onSuccess: () => void;
  defaultValues?: FormData;
  customerId?: number;
}) {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { name: "", phone: "", address: "" },
  });

  async function onSubmit(data: FormData) {
    if (customerId) {
      await db.customers.update(customerId, { ...data });
      toast({ title: "Customer updated" });
    } else {
      await db.customers.add({ ...data, createdAt: new Date().toISOString() });
      toast({ title: "Customer added" });
    }
    form.reset();
    onSuccess();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input placeholder="Customer name" data-testid="input-name" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input placeholder="03XX-XXXXXXX" data-testid="input-phone" {...form.register("phone")} />
        {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Address</Label>
        <Input placeholder="Customer address" data-testid="input-address" {...form.register("address")} />
        {form.formState.errors.address && <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>}
      </div>
      <Button type="submit" className="w-full" data-testid="button-save-customer">
        {customerId ? "Update Customer" : "Add Customer"}
      </Button>
    </form>
  );
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const customers = useLiveQuery(
    () => db.customers.orderBy("name").toArray(),
    []
  );

  const filtered = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6" data-testid="page-customers">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers?.length || 0} total customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-customer">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {!filtered || filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-40" />
              <p>No customers found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="block" data-testid={`customer-${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.address}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
