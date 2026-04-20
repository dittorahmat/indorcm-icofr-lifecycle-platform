import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { LoginCredentials } from '@shared/types';

export function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!credentials.email || !credentials.password) {
      setError('Email and password are required');
      return;
    }

    if (!validateEmail(credentials.email)) {
      setError('Invalid email format');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(authError.message || 'Login failed');
      }

      toast.success(`Login successful`);

      // Smart Redirect (better-auth session handles the data now)
      navigate('/welcome');
      
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please ensure your email and password are correct.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getDepartmentFromEmail = (email: string): string => {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('.ops')) return 'dept-ops';
    if (emailLower.includes('.fin')) return 'dept-fin';
    if (emailLower.includes('.log')) return 'dept-log';
    if (emailLower.includes('.it')) return 'dept-it';
    if (emailLower.includes('.hr')) return 'dept-hr';
    return ''; // Default
  };

  const getLevelFromEmail = (email: string): string => {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('manager') || emailLower.includes('mgr')) return 'Manager';
    if (emailLower.includes('staff')) return 'Staff';
    return 'Staff'; // Default
  };

  const getRoleFromEmail = (email: string): string => {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('staff') || emailLower.includes('manager') || emailLower.startsWith('line1@')) return 'Line 1';
    if (emailLower.startsWith('line2@')) return 'Line 2';
    if (emailLower.startsWith('line3@')) return 'Line 3';
    if (emailLower.startsWith('cfo@')) return 'CFO';
    if (emailLower.startsWith('komisaris@')) return 'Commissioner';
    if (emailLower.startsWith('admin@')) return 'Admin';
    if (emailLower.startsWith('external@')) return 'External Auditor';
    return 'Line 1'; // Default
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Gradient Background - sama dengan HomePage */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 opacity-20 blur-[100px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display font-bold">IndoGRC Pro</CardTitle>
            <CardDescription>
              Enterprise ICOFR Lifecycle Platform
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@bumn.go.id"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col space-y-2">
            {/* Credential Helper */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p className="font-medium text-[10px] uppercase tracking-wider text-slate-400">Demo Credentials (Lini 1):</p>
              <div className="grid grid-cols-2 gap-2 text-[8px] bg-slate-50 p-2 rounded-lg border border-slate-100 max-h-[120px] overflow-y-auto text-left">
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Mining Ops (.ops)</p>
                  <p>staff.ops@bumn.go.id</p>
                  <p className="mb-1">manager.ops@bumn.go.id</p>
                  
                  <p className="font-bold text-slate-500 mb-0.5">Finance (.fin)</p>
                  <p>staff.fin@bumn.go.id</p>
                  <p className="mb-1">manager.fin@bumn.go.id</p>

                  <p className="font-bold text-slate-500 mb-0.5">Logistics (.log)</p>
                  <p>staff.log@bumn.go.id</p>
                  <p>manager.log@bumn.go.id</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">IT (.it)</p>
                  <p>staff.it@bumn.go.id</p>
                  <p className="mb-1">manager.it@bumn.go.id</p>

                  <p className="font-bold text-slate-500 mb-0.5">HR (.hr)</p>
                  <p>staff.hr@bumn.go.id</p>
                  <p className="mb-1">manager.hr@bumn.go.id</p>

                  <p className="font-bold text-slate-500 mb-0.5 border-t pt-1">Core Access</p>
                  <p>line2@bumn.go.id (L2)</p>
                  <p>cfo@bumn.go.id (CFO)</p>
                  <p>komisaris@bumn.go.id (Commissioner)</p>
                  <p>admin@bumn.go.id (Admin)</p>
                </div>
              </div>
              <p className="pt-1 text-[10px]">Password: <code className="bg-muted px-1 rounded">password</code></p>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Compliance with SK-5/DKU.MBU/11/2024
        </p>
      </motion.div>
    </div>
  );
}
