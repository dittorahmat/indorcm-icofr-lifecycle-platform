import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ScanLine,
  Wrench,
  Landmark,
  ShieldCheck,
  FileSearch,
  Fingerprint,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { AIDrilldownView } from './AIDrilldownView';
import type { PeruriUseCase } from './types';

export function AICasesTab() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { t } = useTranslation('reports');

  const useCases: PeruriUseCase[] = [
    {
      id: 'banknote-vision-defect',
      title: t('aiHub.caseBanknoteVisionTitle'),
      icon: <ScanLine className="h-6 w-6" />,
      desc: t('aiHub.caseBanknoteVisionDesc'),
      status: 'LIVE',
      color: 'text-red-700 bg-red-50 border-red-200',
      precision: '99.8%',
    },
    {
      id: 'raw-material-press-maintenance',
      title: t('aiHub.caseRawMaterialTitle'),
      icon: <Wrench className="h-6 w-6" />,
      desc: t('aiHub.caseRawMaterialDesc'),
      status: 'LIVE',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      precision: '98.9%',
    },
    {
      id: 'bi-order-delivery-recon',
      title: t('aiHub.caseBiReconTitle'),
      icon: <Landmark className="h-6 w-6" />,
      desc: t('aiHub.caseBiReconDesc'),
      status: 'LIVE',
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      precision: '99.4%',
    },
    {
      id: 'excise-passport-leakage',
      title: t('aiHub.caseExcisePassportTitle'),
      icon: <ShieldCheck className="h-6 w-6" />,
      desc: t('aiHub.caseExcisePassportDesc'),
      status: 'LIVE',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      precision: '99.9%',
    },
    {
      id: 'raw-material-procurement-nlp',
      title: t('aiHub.caseProcurementNlpTitle'),
      icon: <FileSearch className="h-6 w-6" />,
      desc: t('aiHub.caseProcurementNlpDesc'),
      status: 'BETA',
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      precision: '98.7%',
    },
    {
      id: 'govtech-digital-sla',
      title: t('aiHub.caseGovtechSlaTitle'),
      icon: <Fingerprint className="h-6 w-6" />,
      desc: t('aiHub.caseGovtechSlaDesc'),
      status: 'LIVE',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      precision: '99.8%',
    },
  ];

  return (
    <div className="min-w-0 max-w-full">
      <AnimatePresence mode="wait">
        {selectedCaseId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="min-w-0 max-w-full"
          >
            <AIDrilldownView
              useCase={useCases.find((u) => u.id === selectedCaseId)}
              onBack={() => setSelectedCaseId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 min-w-0 max-w-full"
          >
            {useCases.map((uc) => (
              <div key={uc.id} className="min-w-0">
                <Card
                  className="h-full hover:shadow-md transition-shadow overflow-hidden group cursor-pointer rounded-lg border-border"
                  onClick={() => setSelectedCaseId(uc.id)}
                >
                  <CardHeader className={cn('pb-4 h-full', uc.color)}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-border">{uc.icon}</div>
                      <Badge variant="outline" className="bg-white text-xs font-semibold">{uc.status}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-base font-bold tracking-tight">{uc.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{uc.desc}</p>
                    <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider flex-wrap gap-2">
                      <span>{t('aiHub.modelPrecision', { value: uc.precision })}</span>
                      <span className="group-hover:text-primary transition-colors">{t('aiHub.details')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
