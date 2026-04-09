import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

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
      setError('Email dan password wajib diisi');
      return;
    }

    if (!validateEmail(credentials.email)) {
      setError('Format email tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role: getRoleFromEmail(credentials.email),
        }),
      });

      // Simpan token dan user data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('mockRole', response.user.role);
      localStorage.setItem('userId', response.user.id);

      toast.success(`Login berhasil sebagai ${response.user.name}`);

      // Smart Redirect based on role
      if (response.user.role === 'CFO' || response.user.role === 'Komisaris') {
        navigate('/scoping/approval');
      } else {
        navigate('/welcome');
      }
    } catch (err) {
      setError('Invalid credentials. Pastikan email dan password benar.');
      toast.error('Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleFromEmail = (email: string): string => {
    const emailLower = email.toLowerCase();
    if (emailLower.startsWith('line1@')) return 'Line 1';
    if (emailLower.startsWith('line2@')) return 'Line 2';
    if (emailLower.startsWith('line3@')) return 'Line 3';
    if (emailLower.startsWith('cfo@')) return 'CFO';
    if (emailLower.startsWith('komisaris@')) return 'Komisaris';
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
            <CardTitle className="text-2xl font-display font-bold">IndoRCM Pro</CardTitle>
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
              <p className="font-medium">Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <span>line1@bumn.go.id → Line 1</span>
                <span>line2@bumn.go.id → Line 2</span>
                <span>line3@bumn.go.id → Line 3</span>
                <span>cfo@bumn.go.id → CFO</span>
                <span>komisaris@bumn.go.id → Komut</span>
                <span>admin@bumn.go.id → Admin</span>
                <span>external@bumn.go.id → Ext. Auditor</span>
              </div>
              <p className="pt-1">Password: <code className="bg-muted px-1 rounded">password</code></p>
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
