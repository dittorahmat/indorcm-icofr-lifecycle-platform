import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { TestFormValues } from './test-schema';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface RegulatorySamplingTableProps {
  control: Control<TestFormValues>;
  t: any;
  isReadOnly?: boolean;
}

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
    
    // Calculate new status: if any attribute becomes false, status is Fail
    const otherAttrs = ['attrA', 'attrB', 'attrC', 'attrD'].filter(a => a !== attr) as ('attrA' | 'attrB' | 'attrC' | 'attrD')[];
    const hasFail = !newValue || otherAttrs.some(a => !field[a]);
    
    update(index, {
      ...field,
      [attr]: newValue,
      status: hasFail ? 'Fail' : 'Pass',
    });
  };

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 min-w-0">
          <span className="truncate">{t('sampling.title')}</span> 
          <span className="text-xs font-semibold text-slate-500 shrink-0">(Lampiran 7)</span>
        </h3>
        {!isReadOnly && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addSample} 
            className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-semibold gap-1.5 border-slate-200 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 shrink-0" /> {t('sampling.addSample')}
          </Button>
        )}
      </div>

      {/* MOBILE VIEW: Stacked Touch Cards (< md) */}
      <div className="block md:hidden space-y-3">
        {fields.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-500 text-xs font-medium">
            {t('sampling.empty')}
          </div>
        ) : (
          fields.map((field, index) => (
            <div 
              key={field.id}
              className={cn(
                "p-3.5 rounded-lg border bg-white shadow-xs space-y-3",
                field.status === 'Fail' ? "border-red-200 bg-red-50/20" : "border-slate-200"
              )}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center border border-slate-200">
                    {index + 1}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase",
                    field.status === 'Pass' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                    aria-label={t('sampling.remove', { defaultValue: 'Remove sample' })}
                    onClick={() => remove(index)}
                    className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 text-slate-400 hover:text-destructive hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  {t('sampling.ref')}
                </label>
                <Input 
                  value={field.sampleRef} 
                  onChange={(e) => update(index, { ...field, sampleRef: e.target.value })}
                  disabled={isReadOnly}
                  className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-base sm:text-xs font-medium bg-slate-50/50"
                  placeholder="e.g. VOU-001"
                />
              </div>

              {/* Attributes 4-Pillar Grid */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Atribut Kepatuhan (Lampiran 7)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'attrA', label: 'Attr A: Otomatis' },
                    { key: 'attrB', label: 'Attr B: Lengkap' },
                    { key: 'attrC', label: 'Attr C: Bukti' },
                    { key: 'attrD', label: 'Attr D: Wewenang' },
                  ].map((attr) => (
                    <label 
                      key={attr.key}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 min-h-[40px] rounded-md border text-xs font-semibold cursor-pointer select-none transition-colors",
                        (field as any)[attr.key] 
                          ? "bg-slate-50 border-slate-300 text-slate-800" 
                          : "bg-red-50/40 border-red-200 text-red-700"
                      )}
                    >
                      <Checkbox 
                        checked={(field as any)[attr.key]} 
                        onCheckedChange={() => toggleAttribute(index, attr.key as any)}
                        disabled={isReadOnly}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate">{attr.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  {t('sampling.comments')}
                </label>
                <Input 
                  value={field.comments || ''} 
                  onChange={(e) => update(index, { ...field, comments: e.target.value })}
                  disabled={isReadOnly}
                  className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-base sm:text-xs"
                  placeholder={t('sampling.commentPlaceholder')}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Table (>= md) */}
      <div className="hidden md:block border rounded-md overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint bg-white">
        <Table className="min-w-[720px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px] text-center text-xs uppercase font-bold">No</TableHead>
              <TableHead className="text-xs uppercase font-bold">{t('sampling.ref')}</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold">Attr A</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold">Attr B</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold">Attr C</TableHead>
              <TableHead className="w-[80px] text-center text-xs uppercase font-bold">Attr D</TableHead>
              <TableHead className="w-[100px] text-center text-xs uppercase font-bold">{t('sampling.status')}</TableHead>
              <TableHead className="text-xs uppercase font-bold">{t('sampling.comments')}</TableHead>
              {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 8 : 9} className="h-24 text-center text-muted-foreground text-xs font-normal">
                  {t('sampling.empty')}
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow key={field.id} className={cn(field.status === 'Fail' && "bg-red-50/30")}>
                  <TableCell className="text-center font-mono text-xs">{index + 1}</TableCell>
                  <TableCell>
                    <Input 
                      value={field.sampleRef} 
                      onChange={(e) => update(index, { ...field, sampleRef: e.target.value })}
                      disabled={isReadOnly}
                      className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs font-medium"
                      placeholder="e.g. VOU-001"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={field.attrA} 
                      onCheckedChange={() => toggleAttribute(index, 'attrA')}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={field.attrB} 
                      onCheckedChange={() => toggleAttribute(index, 'attrB')}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={field.attrC} 
                      onCheckedChange={() => toggleAttribute(index, 'attrC')}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={field.attrD} 
                      onCheckedChange={() => toggleAttribute(index, 'attrD')}
                      disabled={isReadOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase",
                        field.status === 'Pass' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {field.status === 'Pass' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {field.status}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={field.comments || ''} 
                      onChange={(e) => update(index, { ...field, comments: e.target.value })}
                      disabled={isReadOnly}
                      className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs"
                      placeholder={t('sampling.commentPlaceholder')}
                    />
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        aria-label={t('sampling.remove', { defaultValue: 'Remove sample' })}
                        className="h-11 w-11 md:h-9 md:w-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-md border border-dashed">
          <p className="font-bold uppercase tracking-tight text-blue-700">Lampiran 7 Legend:</p>
          <p><strong>Attr A:</strong> Otomatisitas</p>
          <p><strong>Attr B:</strong> Populasi Lengkap</p>
          <p><strong>Attr C:</strong> Bukti Memadai</p>
          <p><strong>Attr D:</strong> Kompetensi Pelaksana</p>
        </div>
      )}
    </div>
  );
}
