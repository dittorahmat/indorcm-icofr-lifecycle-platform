import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Shield, Lock, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ManagementAssessmentProps {
  isSigned: boolean;
  isEffective: boolean;
  onSignOff: () => void;
  isSigningOff: boolean;
  settings: any;
  summaryData: any;
}

export function ManagementAssessment({
  isSigned,
  isEffective,
  onSignOff,
  isSigningOff,
  settings,
  summaryData
}: ManagementAssessmentProps) {
  const { t } = useTranslation('reports');

  return (
    <div className="pt-4">
      <div className="flex justify-end mb-4 gap-2 no-print">
        {!isSigned ? (
          <Button onClick={onSignOff} variant="destructive" className="font-bold" disabled={isSigningOff}>
            {isSigningOff ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {t('actions.signAndLock')}
          </Button>
        ) : (
          <Badge className="bg-blue-600 text-white px-4 py-2 text-sm shadow-md gap-2">
            <CheckCircle2 className="h-4 w-4" /> {t('assessment.periodFinalized')}
          </Badge>
        )}
      </div>
      
      <Card className="print:shadow-none border-none sm:border relative overflow-hidden">
        <AnimatePresence>
          {isSigned && (
            <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 0.15 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="border-8 border-green-600 text-green-600 font-black text-9xl p-10 rotate-[-30deg] uppercase tracking-tighter">{t('assessment.signed')}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <CardHeader className="text-center border-b pb-8">
          <div className="flex justify-center mb-4"><Shield className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-2xl uppercase">Management Assessment on ICOFR Implementation Effectiveness</CardTitle>
          <CardDescription>Appendix 11 - SK-5/DKU.MBU/11/2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 py-8 px-10">
          <div className="space-y-4 text-justify leading-relaxed">
            <p>{t('assessment.directorsStatement', { companyName: settings?.companyName || 'IndoRCM' })}</p>
            
            {!isEffective ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
                <p className="font-bold text-red-800 underline mb-2 text-center uppercase">{t('assessment.conclusionIneffective')}</p>
                <p className="text-sm text-red-700">
                  Based on the evaluation performed, management concludes that the Company <strong>did not maintain</strong> effective internal control over financial reporting as of the report date, due to identified material weaknesses.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
                <p className="font-bold text-green-800 underline mb-2 text-center uppercase">{t('assessment.conclusionEffective')}</p>
                <p className="text-sm text-green-700">
                  Based on the evaluation performed, management concludes that the Company <strong>has maintained</strong>, in all material respects, effective internal control over financial reporting as of the report date.
                </p>
              </div>
            )}

            <ol className="list-decimal pl-5 space-y-6 text-sm text-foreground/90">
              <li>We have reviewed the financial statements of {settings?.companyName || 'IndoRCM'} ending on {new Date(settings?.signedOffDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</li>
              <li>To our knowledge, the financial statements do not contain any untrue statement of a material fact or omit to state a material fact necessary to make the statements made, in light of the circumstances under which such statements were made, not misleading.</li>
              <li>To our knowledge, the financial statements and other financial information included in the financial statements, fairly present in all material respects the financial condition and results of operations for the period presented.</li>
              <li>We have implemented controls and procedures for the preparation of financial statements deemed necessary to properly prepare and present the financial statements (consolidated) and free from material misstatement.</li>
            </ol>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg space-y-4">
            <h3 className="font-bold border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Deficiency Details & Remediation Plan
            </h3>
            <Table className="text-xs">
              <TableHeader>
                <TableRow><TableHead>Deficiency</TableHead><TableHead>Severity</TableHead><TableHead>Remediation Plan</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(summaryData?.allDeficiencies || []).filter((d: any) => d.severity !== 'Control Deficiency').map((def: any) => (
                  <TableRow key={def.id}>
                    <TableCell className="font-medium">{def.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{def.severity}</Badge></TableCell>
                    <TableCell className="italic text-muted-foreground">Monitor progress via Deficiency Board</TableCell>
                  </TableRow>
                ))}
                {!(summaryData?.allDeficiencies || []).some((d: any) => d.severity !== 'Control Deficiency') && (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No significant deficiencies or material weaknesses found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-20 pt-12">
            <div className="text-center space-y-24">
              <p className="font-semibold border-b pb-2">Chief Financial Officer (CFO)</p>
              <p className="font-bold">{settings?.cfoName || 'Belum Ditunjuk'}</p>
            </div>
            <div className="text-center space-y-24">
              <p className="font-semibold border-b pb-2">Chief Executive Officer (CEO)</p>
              <p className="font-bold">{settings?.ceoName || 'Belum Ditunjuk'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
