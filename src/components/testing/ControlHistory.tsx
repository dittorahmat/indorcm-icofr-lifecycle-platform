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
    <Card className="h-fit border-slate-200 shadow-xs overflow-hidden rounded-lg">
      <CardHeader className="bg-slate-50/80 border-b py-3.5 sm:py-4 px-4 sm:px-5">
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
          <History className="h-4 w-4 text-indigo-600" /> {t('history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
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
                  className="group relative pl-3.5 border-l-2 border-slate-200 hover:border-indigo-400 transition-colors pb-1"
                >
                  <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
                  
                  <div className="flex justify-between items-center mb-1.5 gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider h-5 px-2 bg-white border-slate-200 text-slate-600 rounded">
                      {h.testType}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {h.testDate ? new Date(h.testDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-200 group-hover:border-indigo-200 group-hover:bg-white transition-all shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide truncate">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {h.method}
                      </span>
                      <Badge className={cn("text-xs font-bold uppercase tracking-wider h-5 px-2 border-none shadow-xs shrink-0 rounded", color)}>
                        {h.result === 'Effective' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-2 group-hover:text-slate-700">
                      "{h.comments}"
                    </p>
                    
                    {h.evaluationAttributes && (
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                        {Object.entries(h.evaluationAttributes).map(([key, val]) => (
                          <Badge key={key} variant="outline" className={cn(
                            "text-xs h-5 px-1.5 font-semibold uppercase rounded",
                            val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
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
            <div className="text-center py-8 sm:py-10 flex flex-col items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider leading-relaxed px-4">
                {t('history.empty')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
