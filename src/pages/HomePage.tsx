import { Link } from 'react-router-dom';
import { Shield, Zap, CheckCircle, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) => (
  <Card className="bg-background/50 backdrop-blur-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 opacity-20 blur-[100px]"></div>
      </div>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-24 md:py-32 lg:py-40 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium mb-4">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                Compliance with SK-5/DKU.MBU/11/2024
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-balance leading-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                Enterprise ICOFR Lifecycle Platform for BUMN
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-pretty">
                IndoRCM Pro digitizes the internal control over financial reporting lifecycle—from planning and scoping to management assessment and audit reporting.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5">
                  <Link to="/dashboard">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                   <a href="https://www.bumn.go.id" target="_blank" rel="noreferrer">Regulation Details</a>
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <h2 className="text-center text-2xl font-bold mb-12">The 5-Step ICOFR Lifecycle</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
               {[
                 { step: "01", name: "Perancangan", desc: "Scoping & RCM" },
                 { step: "02", name: "Implementasi", desc: "CSA Workspace" },
                 { step: "03", name: "Evaluasi", desc: "TOD & TOE" },
                 { step: "04", name: "Remediasi", desc: "Deficiency Board" },
                 { step: "05", name: "Pelaporan", desc: "Sign-off & Exports" },
               ].map((item, i) => (
                 <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
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
            className="grid gap-6 md:grid-cols-3 mb-24"
          >
            <StatCard icon={<Zap className="h-5 w-5 text-muted-foreground" />} title="IndoRCM Control Coverage" value="98.7%" />
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