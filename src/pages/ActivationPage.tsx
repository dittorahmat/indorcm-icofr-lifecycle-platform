import { useState, useEffect } from 'react';
import { Shield, Loader2, AlertCircle, Copy, CheckCircle2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function ActivationPage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [status, setStatus] = useState<{ machineId: string; status: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/license/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch license status', err);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  const handleCopyMachineId = () => {
    if (status?.machineId) {
      navigator.clipboard.writeText(status.machineId);
      setCopied(true);
      toast.success('Machine ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey) {
      toast.error('Please enter a license key');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('System activated successfully!');
        // Refresh page to trigger global guard re-check
        setTimeout(() => window.location.href = '/', 1500);
      } else {
        toast.error(data.message || 'Activation failed');
      }
    } catch (err) {
      toast.error('An error occurred during activation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingStatus) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 opacity-20 blur-[100px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg px-4"
      >
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Key className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display font-bold">System Activation</CardTitle>
            <CardDescription>
              IndoRCM Pro requires a valid license to operate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Machine Binding</AlertTitle>
              <AlertDescription className="text-xs">
                This installation is bound to the hardware ID below. Please provide this ID to your vendor to receive a license key.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Your Machine ID</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={status?.machineId || 'Fetching...'}
                  className="bg-muted font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={handleCopyMachineId}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseKey">License Key</Label>
                <textarea
                  id="licenseKey"
                  placeholder="Enter your encrypted license key here..."
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-transparent text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !licenseKey}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  'Activate System'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Offline activation supported</span>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          IndoRCM Pro &copy; 2026
        </p>
      </motion.div>
    </div>
  );
}
