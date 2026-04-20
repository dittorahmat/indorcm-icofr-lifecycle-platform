import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Gradient Background - sama dengan HomePage dan LoginPage */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 opacity-20 blur-[100px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl px-4 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <Shield className="h-20 w-20 text-primary" />
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Welcome to IndoGRC Pro
          </h1>

          <div className="space-y-2">
            <p className="text-2xl font-semibold text-primary">
              PT BUMN Sejahtera
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Enterprise ICOFR Lifecycle Platform for Compliance with SK-5/DKU.MBU/11/2024
            </p>
          </div>
        </motion.div>

        {/* Get Started Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12"
        >
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5 min-w-[200px]"
          >
            Get Started
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
              <p className="font-medium text-foreground">Line 1</p>
              <p>Process Owner</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border">
              <p className="font-medium text-foreground">Line 2</p>
              <p>ICOFR Manager</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border">
              <p className="font-medium text-foreground">Line 3</p>
              <p>Internal Auditor</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
