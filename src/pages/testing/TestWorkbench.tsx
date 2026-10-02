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
  ChevronDown, ChevronUp, Search,
  Fingerprint, Clock, Lock, ShieldAlert
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
      staggerChildren: 0.04
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1]
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
        className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16 sm:pb-20"
      >
        <motion.div variants={itemVariants}>
          <PageHeader 
            title={<span className="font-semibold text-slate-900 tracking-tight">{t('title')}</span>} 
            description={t('description')}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder={t('searchPlaceholder') || "Search controls..."} 
                  className="pl-9 h-10 w-full sm:w-[240px] bg-white border-slate-200 text-xs font-medium rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-white h-10 px-3.5 sm:px-4 rounded-lg border border-slate-200 shadow-xs shrink-0">
                <Switch 
                  id="validated-filter" 
                  checked={showOnlyValidated} 
                  onCheckedChange={setShowOnlyValidated} 
                  className="data-[state=checked]:bg-emerald-600"
                />
                <Label htmlFor="validated-filter" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer flex items-center gap-2 select-none">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> {t('filterReady')}
                </Label>
              </div>
            </div>
          </PageHeader>
        </motion.div>
        
        <div className="space-y-3.5 sm:space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : filteredControls.length > 0 ? (
            filteredControls.map(control => {
              const latestOpenDeficiency = deficienciesData?.items
                .filter(d => d.controlId === control.id && d.status === 'Open')
                .sort((a, b) => ((b.identifiedDate || 0) as number) - ((a.identifiedDate || 0) as number))[0];

              const violation = isCoolingOffViolation(control);
              const isCsaIneffective = Boolean(
                latestOpenDeficiency && (
                  latestOpenDeficiency.source?.includes('CSA') || 
                  latestOpenDeficiency.source?.includes('TOD')
                )
              );
              const controlHistory = testsData?.items.filter(t => t.controlId === control.id) || [];
              const isExpanded = expandedId === control.id;

              return (
                <motion.div 
                  key={control.id}
                  variants={itemVariants}
                  layout
                  className={cn(
                    "group relative bg-white border rounded-lg transition-all duration-200 overflow-hidden shadow-xs",
                    isExpanded ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200 hover:border-slate-300",
                    (violation || isCsaIneffective) && "border-amber-300 bg-amber-50/15"
                  )}
                >
                  {/* CARD HEADER / TRIGGER */}
                  <div 
                    className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/60 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : control.id)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className={cn(
                        "h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 mt-0.5 sm:mt-0",
                        isExpanded ? "bg-indigo-600 border-indigo-500 text-white" : "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-100",
                        isCsaIneffective && !isExpanded && "bg-amber-50 border-amber-200 text-amber-600"
                      )}>
                        {violation ? <AlertTriangle className="h-5 w-5" /> : isCsaIneffective ? <ShieldAlert className="h-5 w-5" /> : <Fingerprint className="h-5 w-5" />}
                      </div>
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "text-sm sm:text-base font-bold leading-snug line-clamp-2",
                            isExpanded ? "text-indigo-600" : "text-slate-900"
                          )}>
                            {control.name}
                          </span>
                          <Badge variant="outline" className="font-mono text-xs font-bold text-slate-500 border-slate-200 uppercase tracking-tight rounded shrink-0">
                            {control.code}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                           <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" /> {control.frequency}
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 shrink-0" /> {control.nature}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {isCsaIneffective ? (
                          <Badge className="bg-amber-500 text-white border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            {t('badges.csaIneffective', 'Inefektif CSA')}
                          </Badge>
                        ) : latestOpenDeficiency && (
                          <Badge className="bg-rose-500 text-white border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            Open Deficiency
                          </Badge>
                        )}
                        {violation && (
                          <Badge className="bg-amber-500 text-white border-none text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                            Cooling-off Violation
                          </Badge>
                        )}
                        {controlHistory.length > 0 && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-xs font-bold uppercase tracking-wider px-2 py-0.5 gap-1 rounded">
                            <History className="h-3 w-3 shrink-0" /> {controlHistory.length} Tests
                          </Badge>
                        )}
                      </div>
                      
                      <div className={cn(
                        "h-10 w-10 min-h-[40px] min-w-[40px] rounded-md flex items-center justify-center transition-all shrink-0 border border-slate-200",
                        isExpanded ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-slate-400 hover:text-slate-600"
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
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="p-3.5 sm:p-6 border-t border-slate-100 bg-slate-50/40">
                          {violation ? (
                            <div className="p-6 sm:p-8 bg-rose-50/60 border border-rose-200 rounded-lg text-center space-y-3.5 max-w-2xl mx-auto">
                              <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                                <AlertTriangle className="h-6 w-6" />
                              </div>
                              <div className="space-y-1.5">
                                <h4 className="text-base sm:text-lg font-bold text-rose-900">{t('coolingOff.restricted')}</h4>
                                <p className="text-xs sm:text-sm text-rose-700 font-normal leading-relaxed">
                                  {t('coolingOff.prohibited')}
                                </p>
                              </div>
                              <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg font-bold text-xs uppercase tracking-wider h-10 px-5 min-h-[40px]">
                                Contact Compliance Administrator
                              </Button>
                            </div>
                          ) : isCsaIneffective ? (
                            <div className="p-6 sm:p-8 bg-amber-50/60 border border-amber-200 rounded-lg text-center space-y-3.5 max-w-2xl mx-auto">
                              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                                <ShieldAlert className="h-6 w-6" />
                              </div>
                              <div className="space-y-1.5">
                                <h4 className="text-base sm:text-lg font-bold text-amber-900">
                                  {t('gatekeeper.csaIneffectiveTitle')}
                                </h4>
                                <p className="text-xs sm:text-sm text-amber-800 font-normal leading-relaxed">
                                  {t('gatekeeper.csaIneffectiveDescription')}
                                </p>
                              </div>
                              <div className="pt-1">
                                <Badge variant="outline" className="bg-white border-amber-300 text-amber-700 font-mono text-xs px-3 py-1 rounded">
                                  Status: Menunggu Remediasi Lini 1 & 2
                                </Badge>
                              </div>
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
              className="text-center py-16 sm:py-24 bg-white rounded-lg border border-dashed border-slate-200 shadow-xs p-6"
            >
              <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ListFilter className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t('noControls')}</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1.5 font-normal leading-relaxed">
                {t('noControlsDetail')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowOnlyValidated(false)}
                className="mt-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-xs uppercase tracking-wider h-10 px-5 min-h-[40px]"
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
