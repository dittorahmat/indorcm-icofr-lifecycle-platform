import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle2, XCircle, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { TestFormValues } from './test-schema';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface RegulatorySamplingTableProps {
  control: Control<TestFormValues>;
  t: any;
  isReadOnly?: boolean;
}

const ATTRIBUTES = [
  { key: 'attrA' as const, label: 'Attr A: Otomatis' },
  { key: 'attrB' as const, label: 'Attr B: Lengkap' },
  { key: 'attrC' as const, label: 'Attr C: Bukti' },
  { key: 'attrD' as const, label: 'Attr D: Wewenang' },
];

export function RegulatorySamplingTable({ control, t, isReadOnly }: RegulatorySamplingTableProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'samples',
  });

  const addSample = () => {
    append({
      sampleRef: `Sample-${fields.length + 1}`,
      attrA: true,
      attrB: true,
      attrC: true,
      attrD: true,
      status: 'Pass',
      comments: '',
    });
  };

  const toggleAttribute = (index: number, attr: 'attrA' | 'attrB' | 'attrC' | 'attrD') => {
    const field = fields[index];
    const newValue = !field[attr];
    
    // Calculate new status: if any attribute becomes false, status is Fail (Zero Tolerance)
    const otherAttrs = (['attrA', 'attrB', 'attrC', 'attrD'] as const).filter((a) => a !== attr);
    const hasFail = !newValue || otherAttrs.some((a) => !field[a]);
    
    update(index, {
      ...field,
      [attr]: newValue,
      status: hasFail ? 'Fail' : 'Pass',
    });
  };

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {/* Table Header with Regulation & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-secondary shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary min-w-0">
            <span className="truncate">{t('sampling.title', { defaultValue: 'Lembar Uji Bukti Sampel Transaksi' })}</span> 
          </h3>
          <Badge variant="outline" className="text-xs font-bold border-secondary/30 text-secondary bg-secondary/10 px-2 py-0.5 shrink-0">
            {t('sampling.badgeRegulation', { defaultValue: 'Lampiran 7 & 9 SK-5' })}
          </Badge>
        </div>

        {!isReadOnly && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addSample} 
            className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-wider gap-1.5 border-slate-200 bg-white hover:bg-slate-50 w-full sm:w-auto justify-center rounded-lg shadow-xs"
          >
            <Plus className="h-4 w-4 shrink-0 text-secondary" /> {t('sampling.addSample', { defaultValue: 'Tambah Sampel' })}
          </Button>
        )}
      </div>

      {/* MOBILE VIEW: Stacked Touch Cards (< md) */}
      <div className="block md:hidden space-y-3">
        {fields.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-xs font-medium">
            {t('sampling.empty', { defaultValue: 'Belum ada sampel. Klik "Tambah Sampel" untuk memulai pengujian.' })}
          </div>
        ) : (
          fields.map((field, index) => (
            <div 
              key={field.id}
              className={cn(
                "p-4 rounded-xl border bg-white shadow-xs space-y-3",
                field.status === 'Fail' ? "border-rose-200 bg-rose-50/20" : "border-slate-200"
              )}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-surface-container text-primary font-mono text-xs font-bold flex items-center justify-center border border-outline-variant/30">
                    {index + 1}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase",
                    field.status === 'Pass' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  )}>
                    {field.status === 'Pass' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {field.status}
                  </div>
                </div>

                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label={t('sampling.remove', { defaultValue: 'Hapus sampel' })}
                    className="h-9 w-9 text-slate-400 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {t('sampling.ref', { defaultValue: 'Ref. Bukti Dokumen (PO/Invoice/Voucher)' })}
                </label>
                <Input 
                  value={field.sampleRef} 
                  onChange={(e) => update(index, { ...field, sampleRef: e.target.value })}
                  disabled={isReadOnly}
                  className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-base sm:text-xs font-medium bg-slate-50/50 rounded-lg"
                  placeholder="e.g. PO-4500982601 / INV-2024-001"
                />
              </div>

              {/* Attributes 4-Pillar Grid */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('sampling.attributesLegend', { defaultValue: 'Atribut Kepatuhan Transaksi (Lampiran 7)' })}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ATTRIBUTES.map((attr) => (
                    <label 
                      key={attr.key}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 min-h-[40px] rounded-lg border text-xs font-semibold cursor-pointer select-none transition-colors",
                        field[attr.key] 
                          ? "bg-slate-50 border-slate-300 text-slate-800" 
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      )}
                    >
                      <Checkbox 
                        checked={Boolean(field[attr.key])} 
                        onCheckedChange={() => toggleAttribute(index, attr.key)}
                        disabled={isReadOnly}
                        className="h-4 w-4 shrink-0 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                      />
                      <span className="truncate">{attr.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  {t('sampling.comments', { defaultValue: 'Catatan Auditor & Hasil Verifikasi' })}
                </label>
                <Input 
                  value={field.comments || ''} 
                  onChange={(e) => update(index, { ...field, comments: e.target.value })}
                  disabled={isReadOnly}
                  className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-base sm:text-xs rounded-lg"
                  placeholder={t('sampling.commentPlaceholder', { defaultValue: 'Hasil verifikasi transaksi & dokumen pendukung...' })}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Table (>= md) with safe horizontal scroll */}
      <div className="hidden md:block border border-slate-200 rounded-xl overflow-x-auto max-w-full touch-pan-x overscroll-x-contain bg-white shadow-xs">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-2.5">No</TableHead>
              <TableHead className="text-xs uppercase font-bold text-slate-700 min-w-[260px] py-2 px-3">
                {t('sampling.ref', { defaultValue: 'Ref. Bukti Dokumen' })}
              </TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-2">Attr A</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-2">Attr B</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-2">Attr C</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-2">Attr D</TableHead>
              <TableHead className="w-[100px] text-center text-xs uppercase font-bold text-slate-700 py-2 px-2.5">
                {t('sampling.status', { defaultValue: 'Hasil' })}
              </TableHead>
              <TableHead className="text-xs uppercase font-bold text-slate-700 min-w-[280px] py-2 px-3">
                {t('sampling.comments', { defaultValue: 'Catatan Auditor' })}
              </TableHead>
              {!isReadOnly && <TableHead className="w-[50px] py-2 px-2"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 8 : 9} className="h-20 text-center text-slate-400 text-xs font-normal">
                  {t('sampling.empty', { defaultValue: 'Belum ada sampel. Klik "Tambah Sampel" untuk memulai pengujian.' })}
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow key={field.id} className={cn(field.status === 'Fail' && "bg-rose-50/40")}>
                  <TableCell className="text-center font-mono text-xs font-semibold text-slate-600 py-2 px-2.5">{index + 1}</TableCell>
                  <TableCell className="py-2 px-3">
                    <Input 
                      value={field.sampleRef} 
                      onChange={(e) => update(index, { ...field, sampleRef: e.target.value })}
                      disabled={isReadOnly}
                      className="h-11 md:h-8 min-h-[44px] md:min-h-0 text-base md:text-xs font-medium rounded-lg"
                      placeholder="e.g. PO-4500982601"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2 px-2">
                    <Checkbox 
                      checked={Boolean(field.attrA)} 
                      onCheckedChange={() => toggleAttribute(index, 'attrA')}
                      disabled={isReadOnly}
                      className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2 px-2">
                    <Checkbox 
                      checked={Boolean(field.attrB)} 
                      onCheckedChange={() => toggleAttribute(index, 'attrB')}
                      disabled={isReadOnly}
                      className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2 px-2">
                    <Checkbox 
                      checked={Boolean(field.attrC)} 
                      onCheckedChange={() => toggleAttribute(index, 'attrC')}
                      disabled={isReadOnly}
                      className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    />
                  </TableCell>
                  <TableCell className="text-center py-2 px-2">
                    <Checkbox 
                      checked={Boolean(field.attrD)} 
                      onCheckedChange={() => toggleAttribute(index, 'attrD')}
                      disabled={isReadOnly}
                      className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                    />
                  </TableCell>
                  <TableCell className="py-2 px-2.5">
                    <div className="flex justify-center">
                      <div className={cn(
                        "flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase",
                        field.status === 'Pass' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      )}>
                        {field.status === 'Pass' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {field.status}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Input 
                      value={field.comments || ''} 
                      onChange={(e) => update(index, { ...field, comments: e.target.value })}
                      disabled={isReadOnly}
                      className="h-11 md:h-8 min-h-[44px] md:min-h-0 text-base md:text-xs rounded-lg"
                      placeholder={t('sampling.commentPlaceholder', { defaultValue: 'Catatan untuk sampel ini...' })}
                    />
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="py-2 px-2 text-center">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        aria-label={t('sampling.remove', { defaultValue: 'Hapus sampel' })}
                        className="h-11 w-11 md:h-7 md:w-7 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 text-slate-400 hover:text-rose-600 shrink-0 rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {fields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-600 bg-surface-container-low p-3 rounded-lg border border-dashed border-slate-300">
          <p className="font-bold uppercase tracking-tight text-secondary flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>{t('sampling.legendTitle', { defaultValue: 'Lampiran 7 Legend:' })}</span>
          </p>
          <p><strong>Attr A:</strong> Otomatisitas</p>
          <p><strong>Attr B:</strong> Populasi Lengkap</p>
          <p><strong>Attr C:</strong> Bukti Memadai</p>
          <p><strong>Attr D:</strong> Kompetensi Pelaksana</p>
        </div>
      )}
    </div>
  );
}
