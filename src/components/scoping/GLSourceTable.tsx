import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Trash2, CheckCircle2, Circle, Settings2, PlayCircle, Loader2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { GLSnapshot as SharedGLSnapshot } from '@shared/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';

interface GLSnapshotExtended extends SharedGLSnapshot {
  rowCount?: number;
}

interface GLSourceTableProps {
  data: GLSnapshotExtended[];
  onSetActive: (id: string) => void;
  onSetBenchmark: (snapshot: SharedGLSnapshot) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function GLSourceTable({ data, onSetActive, onSetBenchmark, onDelete, isLoading }: GLSourceTableProps) {
  const [showFullTable, setShowFullTable] = React.useState(false);
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
      const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [data]);

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
    <>
      <MobileDesktopBanner recordCount={sortedData.length} />
      <div className="md:hidden space-y-3" data-testid="gl-source-mobile-cards">
        {sortedData.map((snap) => (
          <div key={snap.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-slate-900 leading-snug break-words min-w-0 flex-1">{snap.filename}</p>
              <Badge variant={snap.status === 'Mapped' ? 'default' : 'outline'} className={cn(snap.status === 'Mapped' ? "bg-indigo-600" : "text-slate-400")}>
                {snap.status}
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {snap.uploadDate ? format(new Date(snap.uploadDate), 'dd MMM yyyy, HH:mm') : 'Unknown'} · {snap.rowCount ?? snap.rows?.length ?? 0} accounts
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="flex-1 min-h-[44px] gap-1.5 text-xs font-bold" onClick={() => onSetBenchmark(snap)}>
                <Settings2 className="h-3.5 w-3.5" /> Set Benchmark
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={snap.isActive ? "Currently Active" : "Set as Active Source"}
                className={cn("min-h-[44px] min-w-[44px] rounded-md", snap.isActive ? "text-green-600" : "text-slate-300")}
                onClick={() => onSetActive(snap.id)}
              >
                {snap.isActive ? <CheckCircle2 className="h-5 w-5 fill-green-50" /> : <Circle className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete snapshot"
                className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-destructive"
                onClick={() => onDelete(snap.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFullTable((v) => !v)}
          aria-expanded={showFullTable}
          className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
        >
          {showFullTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showFullTable ? 'Sembunyikan Tabel Penuh' : 'Lihat Tabel Penuh'}
        </Button>
      </div>
      <div className={`border rounded-lg shadow-sm bg-white max-w-full overflow-x-auto overscroll-x-contain touch-pan-x table-scroll-hint ${showFullTable ? 'block' : 'hidden'} md:block`}>
      <Table>
        <TableHeader>
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
          {sortedData.map((snap) => (
            <TableRow key={snap.id} className={cn(snap.isActive && "bg-green-50/30")}>
              <TableCell className="text-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("min-h-[44px] min-w-[44px] rounded-full", snap.isActive ? "text-green-600" : "text-slate-300")}
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
                {snap.uploadDate ? format(new Date(snap.uploadDate), 'dd MMM yyyy, HH:mm') : 'Unknown'}
              </TableCell>
              <TableCell className="text-xs">
                {snap.rowCount ?? snap.rows?.length ?? 0} accounts
              </TableCell>
              <TableCell>
                <Badge variant={snap.status === 'Mapped' ? 'default' : 'outline'} className={cn(
                  snap.status === 'Mapped' ? "bg-indigo-600" : "text-slate-400"
                )}>
                  {snap.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="min-h-[44px] gap-1.5 text-xs font-bold uppercase tracking-wider"
                    onClick={() => onSetBenchmark(snap)}
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Set Benchmark
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-destructive"
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
    </>
  );
}
