import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Trash2, CheckCircle2, Circle, Settings2, PlayCircle, Loader2 
} from 'lucide-react';
import { GLSnapshot } from '@shared/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GLSourceTableProps {
  data: GLSnapshot[];
  onSetActive: (id: string) => void;
  onSetBenchmark: (snapshot: GLSnapshot) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function GLSourceTable({ data, onSetActive, onSetBenchmark, onDelete, isLoading }: GLSourceTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No GL snapshots found. Upload your first file.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[80px] text-center">Active</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Total Accounts</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((snap) => (
            <TableRow key={snap.id} className={cn(snap.isActive && "bg-green-50/30")}>
              <TableCell className="text-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8 rounded-full", snap.isActive ? "text-green-600" : "text-slate-300")}
                  onClick={() => onSetActive(snap.id)}
                  title={snap.isActive ? "Currently Active" : "Set as Active Source"}
                >
                  {snap.isActive ? <CheckCircle2 className="h-5 w-5 fill-green-50" /> : <Circle className="h-5 w-5" />}
                </Button>
              </TableCell>
              <TableCell className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                {snap.filename}
              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {format(snap.uploadDate, 'dd MMM yyyy, HH:mm')}
              </TableCell>
              <TableCell className="text-xs">{snap.rows.length} rows</TableCell>
              <TableCell>
                <Badge variant={snap.status === 'Mapped' ? 'default' : 'outline'} className={cn(
                  snap.status === 'Mapped' ? "bg-indigo-600" : "text-slate-400"
                )}>
                  {snap.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-[11px] font-bold uppercase tracking-wider"
                    onClick={() => onSetBenchmark(snap)}
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Set Benchmark
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-destructive"
                    onClick={() => onDelete(snap.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
