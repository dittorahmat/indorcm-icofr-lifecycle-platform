import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Control, TestRecord, Deficiency, User } from '@shared/types';
import { 
  AlertTriangle, UserCheck, ListFilter, History, 
  ShieldCheck, ChevronDown, ChevronUp, Search,
  Fingerprint, Clock, Lock
} from 'lucide-react';
import { ControlTestCard } from '@/components/testing/ControlTestCard';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export function TestWorkbench() {
  const { t } = useTranslation('testing');
  const [showOnlyValidated, setShowOnlyValidated] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: () => api<{ items: TestRecord[] }>('/api/tests'),
  });

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const isCoolingOffViolation = (control: Control) => {
    if (!userData?.processOwnershipHistory) return false;
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    return userData.processOwnershipHistory.some(h => 
      h.processId === control.rcmId &&
      (h.role === 'Line 1' || h.role === 'Line 2') &&
      h.endDate > oneYearAgo
    );
  };

  const isLoading = controlsLoading || deficienciesLoading || testsLoading;

  const filteredControls = controlsData?.items.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = showOnlyValidated ? c.line2Validation?.status === 'Validated' : true;
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <AppLayout container>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto space-y-8 pb-20"
      >
        <motion.div variants={itemVariants}>
          <PageHeader 
            title={<span className="font-display tracking-tight">{t('title')}</span>} 
            description={t('description')}
          >
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder={t('searchPlaceholder') || "Search controls..."} 
                  className="pl-9 h-10 w-[240px] bg-white border-slate-200 text-xs font-medium rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 bg-white h-10 px-4 rounded-xl border border-slate-200 shadow-sm">
                <Switch 
                  id="validated-filter" 
                  checked={showOnlyValidated} 
                  onCheckedChange={setShowOnlyValidated} 
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Label htmlFor="validated-filter" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> {t('filterReady')}
                </Label>
              </div>
            </div>
          </PageHeader>
        </motion.div>
        
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : filteredControls.length > 0 ? (
            filteredControls.map(control => {
              const latestOpenDeficiency = deficienciesData?.items
                .filter(d => d.controlId === control.id && d.status === 'Open')
                .sort((a, b) => ((b.identifiedDate || 0) as number) - ((a.identifiedDate || 0) as number))[0];

              const violation = isCoolingOffViolation(control);
              const controlHistory = testsData?.items.filter(t => t.controlId === control.id) || [];
              const isExpanded = expandedId === control.id;

              return (
                <motion.div 
                  key={control.id}
                  variants={itemVariants}
                  layout
                  className={cn(
                    "group relative bg-white border-2 rounded-2xl transition-all duration-300",
                    isExpanded ? "border-indigo-200 shadow-xl shadow-indigo-100/50" : "border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-100",
                    violation && "border-rose-100 bg-rose-50/20 opacity-80"
                  )}
                >
                  {/* CARD HEADER / TRIGGER */}
                  <div 
                    className="p-6 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedId(isExpanded ? null : control.id)}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-300",
                        isExpanded ? "bg-indigo-600 border-indigo-400 text-white rotate-6" : "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-100"
                      )}>
                        {violation ? <AlertTriangle className="h-6 w-6" /> : <Fingerprint className="h-6 w-6" />}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-base font-display font-bold leading-none",
                            isExpanded ? "text-indigo-600" : "text-slate-900"
                          )}>
                            {control.name}
                          </span>
                          <Badge variant="outline" className="font-mono text-[10px] font-bold text-slate-400 border-slate-200 uppercase tracking-tighter">
                            {control.code}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Clock className="h-3 w-3" /> {control.frequency}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Lock className="h-3 w-3" /> {control.nature}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 mr-4">
                        {latestOpenDeficiency && (
                          <Badge className="bg-rose-500 text-white border-none text-[9px] font-bold uppercase tracking-widest px-2.5 h-6">
                            Open Deficiency
                          </Badge>
                        )}
                        {violation && (
                          <Badge className="bg-amber-500 text-white border-none text-[9px] font-bold uppercase tracking-widest px-2.5 h-6 animate-pulse">
                            Cooling-off Violation
                          </Badge>
                        )}
                        {controlHistory.length > 0 && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[9px] font-bold uppercase tracking-widest px-2.5 h-6 gap-1.5">
                            <History className="h-3 w-3" /> {controlHistory.length} Tests
                          </Badge>
                        )}
                      </div>
                      
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                        isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"
                      )}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CONTENT */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-8 border-t border-slate-100 pt-8">
                          {violation ? (
                            <div className="p-10 bg-rose-50/50 border border-rose-100 rounded-2xl text-center space-y-4 max-w-2xl mx-auto">
                              <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
                                <AlertTriangle className="h-8 w-8" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-lg font-display font-bold text-rose-900">{t('coolingOff.restricted')}</h4>
                                <p className="text-sm text-rose-700/70 font-medium leading-relaxed">
                                  {t('coolingOff.prohibited')}
                                </p>
                              </div>
                              <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-6">
                                Contact Compliance Administrator
                              </Button>
                            </div>
                          ) : (
                            <ControlTestCard 
                              control={control} 
                              openDeficiencyDate={latestOpenDeficiency?.identifiedDate as number}
                              history={controlHistory}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              variants={itemVariants}
              className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm"
            >
              <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mx-auto mb-6">
                <ListFilter className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900">{t('noControls')}</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 font-medium leading-relaxed">
                {t('noControlsDetail')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowOnlyValidated(false)}
                className="mt-8 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-6"
              >
                Clear Filter
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
}
