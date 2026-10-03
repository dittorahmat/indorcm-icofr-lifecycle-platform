import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles, AlertCircle } from 'lucide-react';
import type { DoDBoxEvaluation } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface BoxDef {
  boxId: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  code: string;
  title: string;
  question: string;
  standard: string;
  suggestionChips: string[];
  evidenceHint: string;
}

interface DoDLogicMatrixProps {
  evaluations: Record<number, DoDBoxEvaluation>;
  onEvaluationChange: (boxId: number, update: Partial<DoDBoxEvaluation>) => void;
  activeBoxes: number[];
}

export function DoDLogicMatrix({
  evaluations,
  onEvaluationChange,
  activeBoxes,
}: DoDLogicMatrixProps) {
  const { t } = useTranslation('deficiency');

  const BOX_DEFINITIONS: BoxDef[] = [
    {
      boxId: 1,
      code: 'Kotak 1',
      title: 'Hubungan Langsung dengan Asersi LK',
      question: 'Apakah defisiensi berhubungan langsung dengan pencapaian satu atau lebih asersi atas laporan keuangan?',
      standard: 'AS 2201.62',
      suggestionChips: [
        'Berhubungan langsung dengan asersi Akurasi dan Kelengkapan',
        'Merupakan defisiensi ITGC tidak langsung (indirect impact)',
      ],
      evidenceHint: 'Asersi terpilih pada Blok Header Temuan',
    },
    {
      boxId: 2,
      code: 'Kotak 2',
      title: 'Kemungkinan (Likelihood) Salah Saji',
      question: 'Apakah terdapat kemungkinan (likelihood) dari salah saji dihasilkan dari defisiensi (atau kombinasi defisiensi)?',
      standard: 'AS 2201.64-65',
      suggestionChips: [
        'Ditemukan 3 sampel gagal pada pengujian TOE Q3',
        'Tingkat eksepsi rendah dan belum terbukti memicu salah saji riil',
      ],
      evidenceHint: 'Hasil pengujian sampel TOD / TOE (#WP-042)',
    },
    {
      boxId: 3,
      code: 'Kotak 3',
      title: 'Magnitude Potensi Salah Saji vs PM',
      question: 'Apakah terdapat kemungkinan magnitude dari potensi salah saji (dengan mempertimbangkan faktor material untuk LK)?',
      standard: 'AS 2201.66-67',
      suggestionChips: [
        'Nilai eksposur melampaui ambang batas Performance Materiality',
        'Nilai eksposur di bawah batas materialitas toleransi (immaterial)',
      ],
      evidenceHint: 'Nilai eksposur saldo akun vs PM Threshold',
    },
    {
      boxId: 5,
      code: 'Kotak 5',
      title: 'Ketersediaan Pengendalian Kompensasi',
      question: 'Apakah terdapat pengendalian kompensasi efektif yang beroperasi pada presisi cukup untuk mencegah/mendeteksi salah saji material?',
      standard: 'AS 2201.68',
      suggestionChips: [
        'Terdapat kontrol detektif sekunder yang telah diuji efektif',
        'Tidak ada kontrol kompensasi yang beroperasi pada presisi memadai',
      ],
      evidenceHint: 'RCM Secondary Controls Matrix',
    },
    {
      boxId: 4,
      code: 'Kotak 4',
      title: 'Perhatian Pihak Pengawas (Dewan / Komite)',
      question: 'Apakah defisiensi cukup penting untuk mendapat perhatian dari pihak yang bertanggung jawab mengawasi pelaporan keuangan?',
      standard: 'AS 2201.A11',
      suggestionChips: [
        'Cukup penting untuk dilaporkan kepada Komite Audit dan Direksi',
        'Defisiensi operasional minor, dapat diselesaikan di tingkat Lini 1',
      ],
      evidenceHint: 'Materialitas kualitatif & tata kelola internal',
    },
    {
      boxId: 6,
      code: 'Kotak 6',
      title: 'Kesimpulan Prudent Official (MW vs SD)',
      question: 'Akankah individu berpengetahuan luas, kompeten, dan objektif (prudent official) menyimpulkan defisiensi sebagai material weakness?',
      standard: 'AS 2201.18 & 70',
      suggestionChips: [
        'Memenuhi kriteria Kelemahan Material (prudent official conclusion)',
        'Merupakan Defisiensi Signifikan (tidak sampai tingkat kelemahan material)',
      ],
      evidenceHint: 'Indikator keras: Fraud, restatement, kegagalan komite',
    },
    {
      boxId: 7,
      code: 'Kotak 7',
      title: 'Evaluasi Agregasi Defisiensi Akun Sejenis',
      question: 'Apakah terdapat beberapa defisiensi kontrol/signifikan yang mempengaruhi saldo akun atau pengungkapan LK yang sama?',
      standard: 'AS 2201.65',
      suggestionChips: [
        'Terdapat temuan lain pada akun/siklus yang sama (perlu loop-back agregasi)',
        'Tidak ada defisiensi lain pada akun ini (evaluasi final)',
      ],
      evidenceHint: 'Daftar temuan agregat pada akun yang sama',
    },
  ];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {t('worksheet.matrix.boxHeader')} (Kotak 1 s.d Kotak 7 Lampiran 10)
        </h4>
        <span className="text-xs text-muted-foreground">
          Alur Logika: Standar Regulasi SK-5/2024 Gambar 5
        </span>
      </div>

      <div className="divide-y divide-border">
        {BOX_DEFINITIONS.map((box) => {
          const isActive = activeBoxes.includes(box.boxId);
          const currentEval = evaluations[box.boxId] || { answer: false, justification: '' };
          const hasJustification = Boolean(currentEval.justification?.trim());

          return (
            <div
              key={box.boxId}
              className={`p-4 transition-colors space-y-3 ${
                isActive ? 'bg-card' : 'bg-muted/10 opacity-60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-semibold">
                      {box.code}
                    </Badge>
                    <span className="font-bold text-xs text-foreground">{box.title}</span>
                    <span className="text-xs text-muted-foreground font-mono">[{box.standard}]</span>
                    {!isActive && (
                      <span className="text-xs text-muted-foreground">(Dilewati oleh alur logika)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {box.question}
                  </p>
                </div>

                {/* Yes / No Toggle Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={!isActive}
                    onClick={() => onEvaluationChange(box.boxId, { answer: true })}
                    className={`px-3 min-h-[44px] rounded-md text-xs font-semibold transition-colors flex flex-1 sm:flex-none items-center justify-center gap-1 border ${
                      currentEval.answer === true
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted/30 disabled:opacity-40'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t('worksheet.matrix.yes')}
                  </button>
                  <button
                    type="button"
                    disabled={!isActive}
                    onClick={() => onEvaluationChange(box.boxId, { answer: false })}
                    className={`px-3 min-h-[44px] rounded-md text-xs font-semibold transition-colors flex flex-1 sm:flex-none items-center justify-center gap-1 border ${
                      currentEval.answer === false
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted/30 disabled:opacity-40'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t('worksheet.matrix.no')}
                  </button>
                </div>
              </div>

              {/* Justification Field & Evidence Reference */}
              {isActive && (
                <div className="bg-muted/20 rounded-md p-3 border border-border space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      {t('worksheet.matrix.justificationHeader')}
                      {!hasJustification && (
                        <span className="text-rose-500 font-bold">*</span>
                      )}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Ref: <strong className="text-foreground font-medium">{box.evidenceHint}</strong>
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={currentEval.justification || ''}
                    onChange={(e) => onEvaluationChange(box.boxId, { justification: e.target.value })}
                    placeholder={t('worksheet.matrix.justificationPlaceholder')}
                    className="w-full text-base sm:text-xs bg-background border border-input rounded-md p-2 text-foreground font-medium outline-none focus:border-primary transition-colors"
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {t('worksheet.matrix.chipsLabel')}
                    </span>
                    {box.suggestionChips.map((chip, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          const current = currentEval.justification || '';
                          const nextText = current ? `${current}. ${chip}` : chip;
                          onEvaluationChange(box.boxId, { justification: nextText });
                        }}
                        className="text-xs bg-background border border-border hover:border-primary hover:text-primary px-2 py-2 min-h-[44px] rounded text-muted-foreground transition-colors text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {!hasJustification && (
                    <div className="flex items-center gap-1 text-xs text-rose-500 pt-0.5">
                      <AlertCircle className="h-3 w-3" />
                      <span>{t('worksheet.matrix.mandatoryError')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
