import React from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
          {t('sampling.title')} 
          <span className="text-[10px] font-normal lowercase text-muted-foreground">(Lampiran 7)</span>
        </h3>
        {!isReadOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addSample} className="h-8 gap-2">
            <Plus className="h-4 w-4" /> {t('sampling.addSample')}
          </Button>
        )}
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px] text-center text-[10px] uppercase font-bold">No</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">{t('sampling.ref')}</TableHead>
              <TableHead className="w-[80px] text-center text-[10px] uppercase font-bold">Attr A</TableHead>
              <TableHead className="w-[80px] text-center text-[10px] uppercase font-bold">Attr B</TableHead>
              <TableHead className="w-[80px] text-center text-[10px] uppercase font-bold">Attr C</TableHead>
              <TableHead className="w-[80px] text-center text-[10px] uppercase font-bold">Attr D</TableHead>
              <TableHead className="w-[100px] text-center text-[10px] uppercase font-bold">{t('sampling.status')}</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">{t('sampling.comments')}</TableHead>
              {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReadOnly ? 8 : 9} className="h-24 text-center text-muted-foreground italic text-xs">
                  {t('sampling.empty')}
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow key={field.id} className={cn(field.status === 'Fail' && "bg-red-50/30")}>
                  <TableCell className="text-center font-mono text-[10px]">{index + 1}</TableCell>
                  <TableCell>
                    <Input 
                      value={field.sampleRef} 
                      onChange={(e) => update(index, { ...field, sampleRef: e.target.value })}
                      disabled={isReadOnly}
                      className="h-8 text-[11px] font-medium"
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
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase",
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
                      className="h-8 text-[11px]"
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
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-muted/20 p-2 rounded border border-dashed">
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
