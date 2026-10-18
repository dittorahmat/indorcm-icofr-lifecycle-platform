import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Static SK-5 Tabel 1 compliance note shown under the application inventory. */
export function Table1ComplianceNote() {
  const { t } = useTranslation('rcm');
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">
          {t('rcm:soc.mapping.title', { defaultValue: 'Table 1 Compliance: COBIT to ITGC Mapping' })}
        </p>
        <p className="text-xs text-blue-700 leading-relaxed">
          {t('rcm:soc.mapping.description', {
            defaultValue:
              'In accordance with SK-5 Table 1 regulation, each IT control (COBIT 2019) is automatically mapped to 4 main ITGC areas: Access to Program & Data, Program Change, Program Development, and Computer Operations.',
          })}
        </p>
      </div>
    </div>
  );
}
