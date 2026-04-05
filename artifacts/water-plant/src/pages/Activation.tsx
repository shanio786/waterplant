import { useState } from "react";
import { Droplets, ShieldCheck, AlertTriangle, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Props = {
  displayId: string;
  onActivated: () => void;
};

export default function Activation({ displayId, onActivated }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function formatInput(val: string) {
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 16);
    return clean.match(/.{1,4}/g)?.join("-") || clean;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const api = (window as any).electronAPI;
    if (!api) { setLoading(false); return; }
    const result = await api.submitActivation(code);
    setLoading(false);
    if (result.success) {
      onActivated();
    } else {
      setError(result.message || "Invalid activation code");
    }
  }

  function copyMachineId() {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappMsg = encodeURIComponent(
    `Assalam o Alaikum, Water Plant Manager activate karna hai.\nMere PC ka Machine ID:\n${displayId}\n\nPlease activation code send karein.`
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Droplets className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Water Plant Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Software Activation Required</p>
        </div>

        {/* Machine ID Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Your Machine ID
            </CardTitle>
            <CardDescription>
              Send this ID to Devoria Tech to get your activation code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xl font-bold tracking-widest text-center py-3 px-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-blue-700">
                {displayId}
              </div>
              <Button variant="outline" size="sm" onClick={copyMachineId} className="shrink-0">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            {/* WhatsApp Button */}
            <a
              href={`https://wa.me/923117597815?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Phone className="h-4 w-4" />
              Send to Devoria Tech via WhatsApp
            </a>
          </CardContent>
        </Card>

        {/* Activation Code Entry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enter Activation Code</CardTitle>
            <CardDescription>
              Enter the code provided by Devoria Tech
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Activation Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(formatInput(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="font-mono text-center text-lg tracking-widest"
                  maxLength={19}
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || code.replace(/-/g,"").length < 16}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : "Activate Software"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-2">
          Powered by <span className="font-semibold text-gray-500">Devoria Tech</span>&nbsp;|&nbsp;+92 311 7597815
        </p>
      </div>
    </div>
  );
}
