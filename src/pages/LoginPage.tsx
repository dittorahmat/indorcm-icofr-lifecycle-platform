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
import { useTranslation } from 'react-i18next';

export function LoginPage() {
  const { t } = useTranslation('auth');
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
      setError(t('validation.required'));
      return;
    }

    if (!validateEmail(credentials.email)) {
      setError(t('validation.invalidEmail'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(authError.message || t('loginFailed'));
      }

      toast.success(t('loginSuccess'));

      // Smart Redirect
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.message || t('validation.invalidCredentials'));
      toast.error(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 text-foreground relative overflow-hidden">
      {/* Background Pattern - Subtle & Professional */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md px-4"
      >
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="space-y-1 text-center px-4 sm:px-6 pb-6 pt-8 sm:pb-8 sm:pt-10">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-slate-200">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-slate-900">{t('appName')}</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
              {t('subtitle')}
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
                <Label htmlFor="email">{t('email')}</Label>
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
                <Label htmlFor="password">{t('password')}</Label>
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
                className="w-full h-11 min-h-[44px] text-base sm:text-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col space-y-2">
            {/* Credential Helper */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p className="font-medium text-xs uppercase tracking-wider text-slate-400">{t('demo.title')}</p>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 max-h-[120px] overflow-y-auto text-left">
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">{t('demo.departments.mining')}</p>
                  <p>staff.ops@bumn.go.id</p>
                  <p className="mb-1">manager.ops@bumn.go.id</p>
                  
                  <p className="font-bold text-slate-500 mb-0.5">{t('demo.departments.finance')}</p>
                  <p>staff.fin@bumn.go.id</p>
                  <p className="mb-1">manager.fin@bumn.go.id</p>

                  <p className="font-bold text-slate-500 mb-0.5">{t('demo.departments.logistics')}</p>
                  <p>staff.log@bumn.go.id</p>
                  <p>manager.log@bumn.go.id</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">{t('demo.departments.it')}</p>
                  <p>staff.it@bumn.go.id</p>
                  <p className="mb-1">manager.it@bumn.go.id</p>

                  <p className="font-bold text-slate-500 mb-0.5">{t('demo.departments.hr')}</p>
                  <p>staff.hr@bumn.go.id</p>
                  <p className="mb-1">manager.hr@bumn.go.id</p>

                  <p className="font-bold text-slate-500 mb-0.5 border-t pt-1">{t('demo.coreAccess')}</p>
                  <p>line2@bumn.go.id {t('demo.roles.l2')}</p>
                  <p>cfo@bumn.go.id {t('demo.roles.cfo')}</p>
                  <p>komisaris@bumn.go.id {t('demo.roles.commissioner')}</p>
                  <p>admin@bumn.go.id {t('demo.roles.admin')}</p>
                </div>
              </div>
              <p className="pt-1 text-xs">{t('demo.password')}: <code className="bg-muted px-1 rounded">password</code></p>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('compliance')}
        </p>
      </motion.div>
    </div>
  );
}
