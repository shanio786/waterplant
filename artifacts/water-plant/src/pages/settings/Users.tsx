import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { USER_ROLES } from "@/lib/types";
import type { UserRole } from "@/lib/types";
import { Plus, Trash2, Users, Lock, ShieldCheck } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  username: z.string().min(3, "Username min 3 chars").regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, _ only"),
  password: z.string().min(4, "Password min 4 chars"),
  role: z.enum(["dev", "admin", "store_manager"]),
});

type FormData = z.infer<typeof schema>;

const roleColors: Record<UserRole, string> = {
  dev: "bg-red-100 text-red-700",
  admin: "bg-blue-100 text-blue-700",
  store_manager: "bg-green-100 text-green-700",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const users = useLiveQuery(() => db.users.toArray(), []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", username: "", password: "", role: "store_manager" },
  });

  if (currentUser?.role !== "dev") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Lock className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">صرف Developer account users manage کر سکتا ہے</p>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    const exists = await db.users.where("username").equalsIgnoreCase(data.username).first();
    if (exists) {
      form.setError("username", { message: "Username already taken" });
      return;
    }
    const hash = await hashPassword(data.password);
    await db.users.add({
      name: data.name,
      username: data.username,
      passwordHash: hash,
      role: data.role as UserRole,
      createdAt: new Date().toISOString(),
    });
    toast({ title: "User created", description: `${data.name} (${data.username})` });
    form.reset({ name: "", username: "", password: "", role: "store_manager" });
    setDialogOpen(false);
  }

  async function deleteUser(id: number) {
    if (id === currentUser?.userId) {
      toast({ title: "Cannot delete your own account", variant: "destructive" });
      return;
    }
    await db.users.delete(id);
    toast({ title: "User deleted" });
  }

  return (
    <div className="space-y-6" data-testid="page-users">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">System users اور access manage کریں</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <div className="space-y-3">
        {(users || []).map((u) => (
          <Card key={u.id} data-testid={`user-${u.id}`}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <Badge className={`text-xs ${roleColors[u.role]}`} variant="secondary">
                  {USER_ROLES.find((r) => r.value === u.role)?.label || u.role}
                </Badge>
                {u.id === currentUser?.userId && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
              </div>
              {u.id !== currentUser?.userId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteUser(u.id!)}
                  data-testid={`button-delete-user-${u.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {users?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-40" />
              <p>No users found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Ali Ahmed" {...form.register("name")} data-testid="input-name" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="ali_ahmed" {...form.register("username")} data-testid="input-username" />
              {form.formState.errors.username && <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 4 characters" {...form.register("password")} data-testid="input-password" />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as UserRole)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" data-testid="button-save-user">Create User</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
