import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RCMImportWizardModal } from '@/components/rcm/import/RCMImportWizardModal';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

export function ImportPage() {
  const { t } = useTranslation(['rcm', 'common']);
  const navigate = useNavigate();
  const { workingYear } = useFiscalYearStore();
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {t('rcm:importWizard.title', { defaultValue: 'Pusat Impor Data RCM (SK-5 Lampiran 5)' })}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">
            {t('rcm:importWizard.pageSubtitle', {
              defaultValue: 'Impor terpadu untuk matriks risiko dan pengendalian ICOFR (TLC, ELC, dan ITGC) dengan rekonsiliasi diagram alur.',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                <FileUp className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Import Wizard Terpadu</CardTitle>
              <CardDescription className="text-xs">
                Unggah spreadsheet RCM resmi Lampiran 5 (TLC, ELC, atau ITGC) dan petakan ke simpul alur BPM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full h-11 sm:h-10 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                Buka Import Wizard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Matriks RCM TLC</CardTitle>
              <CardDescription className="text-xs">
                Kelola matriks pengendalian tingkat transaksi (TLC), edit detail, dan ekspor ke format Excel audit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => navigate('/rcm/tlc')}
                className="w-full h-11 sm:h-10 min-h-[44px] font-semibold text-xs"
              >
                Lihat Matriks TLC <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <RCMImportWizardModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          workingYear={workingYear}
          onSuccess={() => {
            navigate('/rcm/tlc');
          }}
        />
      </div>
    </AppLayout>
  );
}