import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/db";
import { Building2, Lock } from "lucide-react";

const schema = z.object({
  companyName: z.string().min(1, "Company name required"),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  footerNote: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function BusinessSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = useLiveQuery(() => db.businessSettings.toCollection().first(), []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "", phone: "", address: "", city: "", footerNote: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        companyName: settings.companyName,
        phone: settings.phone,
        address: settings.address,
        city: settings.city,
        footerNote: settings.footerNote,
      });
    }
  }, [settings, form]);

  if (user?.role !== "dev") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Lock className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">صرف Developer account یہ settings change کر سکتا ہے</p>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    if (settings?.id) {
      await db.businessSettings.update(settings.id, { ...data, updatedAt: new Date().toISOString() });
    } else {
      await db.businessSettings.add({ ...data, updatedAt: new Date().toISOString() });
    }
    toast({ title: "Settings saved", description: "Invoice header updated" });
  }

  return (
    <div className="space-y-6 max-w-xl" data-testid="page-business-settings">
      <div>
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-sm text-muted-foreground">Invoice اور receipt پر company کی معلومات</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company / Business Name</Label>
              <Input placeholder="e.g. Al-Noor Water Plant" {...form.register("companyName")} data-testid="input-company-name" />
              {form.formState.errors.companyName && (
                <p className="text-xs text-destructive">{form.formState.errors.companyName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone / Mobile</Label>
                <Input placeholder="03001234567" {...form.register("phone")} data-testid="input-phone" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input placeholder="e.g. Karachi" {...form.register("city")} data-testid="input-city" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Full address..." {...form.register("address")} data-testid="input-address" />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice Footer Note</Label>
              <Textarea
                placeholder="e.g. Thank you for your business! / شکریہ"
                rows={2}
                {...form.register("footerNote")}
                data-testid="input-footer-note"
              />
              <p className="text-xs text-muted-foreground">یہ note invoice کے نیچے print ہوگا</p>
            </div>
            <Button type="submit" className="w-full" data-testid="button-save-settings">
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="py-3">
          <p className="text-xs text-blue-700 font-medium">Preview on Invoice:</p>
          <div className="mt-2 text-sm">
            <p className="font-bold">{form.watch("companyName") || "Company Name"}</p>
            {form.watch("phone") && <p className="text-xs text-gray-600">📞 {form.watch("phone")}</p>}
            {form.watch("address") && <p className="text-xs text-gray-600">📍 {form.watch("address")}{form.watch("city") ? `, ${form.watch("city")}` : ""}</p>}
            {form.watch("footerNote") && <p className="text-xs text-gray-500 mt-1 italic">"{form.watch("footerNote")}"</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
