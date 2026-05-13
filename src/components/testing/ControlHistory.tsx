import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTestResultLabel } from '@/lib/compliance-utils';
import { TestRecord } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface ControlHistoryProps {
  history: TestRecord[];
}

export function ControlHistory({ history }: ControlHistoryProps) {
  const { t } = useTranslation('testing');

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <History className="h-4 w-4" /> {t('history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.length > 0 ? (
            history.sort((a, b) => (b.testDate || 0) - (a.testDate || 0)).map((h) => (
              <div key={h.id} className="text-xs border rounded-md p-3 space-y-2 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">{h.testType}</Badge>
                  <span className="text-xs text-muted-foreground">{h.testDate ? new Date(h.testDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{h.method}</span>
                  <Badge className={cn("gap-1 text-xs", getTestResultLabel(h.result).color)}>
                    {h.result === 'Effective' ? (
                      <CheckCircle2 className="h-2 w-2" />
                    ) : (
                      <XCircle className="h-2 w-2" />
                    )}
                    {getTestResultLabel(h.result).label}
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2 italic">"{h.comments}"</p>
                
                {h.evaluationAttributes && (
                  <div className="pt-2 border-t flex flex-wrap gap-1">
                    {Object.entries(h.evaluationAttributes).map(([key, val]) => (
                      <Badge key={key} variant={val ? "secondary" : "outline"} className={cn(
                        "text-xs h-4 px-1",
                        !val && "text-red-500 border-red-200"
                      )}>
                        {key.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground italic text-xs">
              {t('history.empty')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
