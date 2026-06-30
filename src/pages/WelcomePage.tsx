import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function WelcomePage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-foreground relative overflow-hidden">
      {/* Background Pattern - Consistent with Login */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl px-4 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <div className="h-24 w-24 bg-mancity-pattern rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-100">
            <Shield className="h-12 w-12 text-primary-foreground" />
          </div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tighter text-slate-900 leading-none">
            {t('appName')}
          </h1>

          <div className="space-y-3">
            <p className="text-2xl font-bold text-slate-700">
              {t('bumnName')}
            </p>
            <p className="text-base font-semibold text-slate-500 uppercase tracking-widest max-w-xl mx-auto">
              {t('description')}
            </p>
          </div>
        </motion.div>

        {/* Get Started Button */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-14"
        >
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-xl shadow-blue-100 transition-all px-10 h-14 text-base font-bold rounded-xl"
          >
            {t('getStarted')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg bg-card/50 border">
              <p className="font-medium text-foreground">{t('lines.l1.title')}</p>
              <p>{t('lines.l1.desc')}</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border">
              <p className="font-medium text-foreground">{t('lines.l2.title')}</p>
              <p>{t('lines.l2.desc')}</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border">
              <p className="font-medium text-foreground">{t('lines.l3.title')}</p>
              <p>{t('lines.l3.desc')}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
