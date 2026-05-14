import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle2, XCircle, Clock, Search, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTestResultLabel } from '@/lib/compliance-utils';
import { TestRecord } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface ControlHistoryProps {
  history: TestRecord[];
}

export function ControlHistory({ history }: ControlHistoryProps) {
  const { t } = useTranslation('testing');

  return (
    <Card className="h-fit border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b py-4 px-5">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2.5 text-slate-900">
          <History className="h-4 w-4 text-indigo-600" /> {t('history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {history.length > 0 ? (
            history.sort((a, b) => (b.testDate || 0) - (a.testDate || 0)).map((h, i) => {
              const { label, color } = getTestResultLabel(h.result);
              return (
                <motion.div 
                  key={h.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative pl-4 border-l-2 border-slate-100 hover:border-indigo-300 transition-colors pb-1"
                >
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest h-5 px-2 bg-white border-slate-200 text-slate-500">
                      {h.testType}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {h.testDate ? new Date(h.testDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100 group-hover:border-indigo-100 group-hover:bg-white transition-all shadow-sm group-hover:shadow-indigo-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-tight">
                        <FileText className="h-3 w-3 text-slate-400" />
                        {h.method}
                      </span>
                      <Badge className={cn("text-[9px] font-bold uppercase tracking-widest h-5 px-2 border-none shadow-sm", color)}>
                        {h.result === 'Effective' ? (
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5 mr-1" />
                        )}
                        {label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2 italic group-hover:text-slate-600">
                      "{h.comments}"
                    </p>
                    
                    {h.evaluationAttributes && (
                      <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-1">
                        {Object.entries(h.evaluationAttributes).map(([key, val]) => (
                          <Badge key={key} variant="outline" className={cn(
                            "text-[8px] h-4 px-1.5 font-bold uppercase tracking-tighter",
                            val ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                          )}>
                            {key.substring(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                <Search className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                {t('history.empty')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
