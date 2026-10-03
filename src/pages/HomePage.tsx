import { Link } from 'react-router-dom';
import { Shield, Zap, CheckCircle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) => (
  <Card className="bg-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-wrap gap-2">
      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-display font-black tracking-tight">{value}</div>
    </CardContent>
  </Card>
);
export function HomePage() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40">
      </div>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 sm:py-16 md:py-24 lg:py-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center rounded-full bg-mancity-pattern px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground mb-6 shadow-md shadow-blue-100">
                <Shield className="h-4 w-4 mr-2" />
                Compliance with SK-5/DKU.MBU/11/2024
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-slate-900 leading-[1.1] text-balance px-4 sm:px-0">
                Enterprise ICOFR <br/>Lifecycle Platform
              </h1>
              <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                {t('appDescription')}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                <Button size="lg" asChild className="bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-lg shadow-blue-100 transition-all duration-300 transform hover:-translate-y-0.5 w-full sm:w-auto">
                  <Link to="/dashboard">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                   <a href="https://www.bumn.go.id" target="_blank" rel="noreferrer">Regulation Details</a>
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 sm:mb-16 md:mb-24"
          >
            <h2 className="text-center text-2xl font-bold mb-12">The 5-Step ICOFR Lifecycle</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 relative">
               {[
                 { step: "01", name: "Perancangan", desc: "Scoping & RCM" },
                 { step: "02", name: "Implementasi", desc: "CSA Workspace" },
                 { step: "03", name: "Evaluasi", desc: "TOD & TOE" },
                 { step: "04", name: "Remediasi", desc: "Deficiency Board" },
                 { step: "05", name: "Pelaporan", desc: "Sign-off & Exports" },
               ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-4xl font-black text-muted/30 mb-2">{item.step}</span>
                    <h3 className="font-bold text-sm uppercase tracking-wider">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 md:mb-24"
          >
            <StatCard icon={<Zap className="h-5 w-5 text-muted-foreground" />} title="ISB Risk Control Coverage" value="98.7%" />
            <StatCard icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />} title="Controls Effective" value="95.2%" />
            <StatCard icon={<BarChart className="h-5 w-5 text-muted-foreground" />} title="Open Deficiencies" value="12" />
          </motion.div>
        </div>
      </main>
      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>Built with ❤️ at Cloudflare</p>
        </div>
      </footer>
    </div>
  );
}