import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';
import { getTestResultLabel } from '@/lib/compliance-utils';

interface RcmTableProps {
  items: any[];
  isLoading: boolean;
  onEdit: (item: any) => void;
}

export const RcmTlcTable: React.FC<RcmTableProps> = ({ items, isLoading, onEdit }) => {
  if (isLoading) return <div className="p-8 text-center text-muted-foreground italic">Loading TLC Matrix...</div>;
  if (items.length === 0) return <div className="p-8 text-center text-muted-foreground italic">No TLC mappings found for this process.</div>;

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Control Name</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Nature</TableHead>
            <TableHead>Freq</TableHead>
            <TableHead>Assertions</TableHead>
            <TableHead>IPO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow 
              key={`${item.mappingId}-${idx}`} 
              className="cursor-pointer hover:bg-slate-50/50"
              onClick={() => onEdit(item)}
            >
              <TableCell className="font-bold text-indigo-700">{item.controlCode}</TableCell>
              <TableCell>
                <div className="font-medium">{item.mappedControlName || item.baseControlName}</div>
                <div className="text-xs text-muted-foreground line-clamp-1 italic">
                  {item.mappedControlDescription || item.baseControlDescription}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={
                  item.riskRating === 'High' ? 'border-red-200 bg-red-50 text-red-700' :
                  item.riskRating === 'Medium' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                  'border-green-200 bg-green-50 text-green-700'
                }>
                  {item.riskRating}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{item.controlType}</TableCell>
              <TableCell className="text-xs">{item.controlNature}</TableCell>
              <TableCell className="text-xs">{item.frequency}</TableCell>
              <TableCell>
                <div className="flex gap-0.5">
                  {['E', 'C', 'A', 'Co', 'Va', 'Ro', 'Pd'].map(a => (
                    <div 
                      key={a}
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold border ${item[`assertion${a}`] ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                    >
                      {a[0]}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-0.5">
                  {['C', 'A', 'V', 'Ra'].map(a => (
                    <div 
                      key={a}
                      className={`w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold border ${item[`ipo${a}`] ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                    >
                      {a[0]}
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
