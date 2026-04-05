import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/db";
import { Droplets, LogIn } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const settings = useLiveQuery(() => db.businessSettings.toCollection().first(), []);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("غلط username یا password");
    } else {
      setLocation("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Droplets className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {settings?.companyName || "Water Plant"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Management System</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-center">Login کریں</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dev"
                  autoComplete="username"
                  data-testid="input-username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  data-testid="input-password"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? "لاگ ان ہو رہا ہے..." : "Login"}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Default: dev / dev123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
