import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, Eye, LayoutGrid, Clock, ChevronRight, Loader2
} from 'lucide-react';
import { MaterialitySimulation, SimulationStatus } from '@shared/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SimulationListTableProps {
  data: MaterialitySimulation[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function SimulationListTable({ data, onSelect, onDelete, isLoading }: SimulationListTableProps) {
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
        <LayoutGrid className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No simulations found. Create your first scenario.</p>
      </div>
    );
  }

  const getStatusBadge = (status: SimulationStatus) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-green-600">Approved</Badge>;
      case 'Pending CFO': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Review CFO</Badge>;
      case 'Pending Komut': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Review Komut</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Simulation Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Basis</TableHead>
            <TableHead className="text-right">PM Value</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sim) => (
            <TableRow key={sim.id} className="group hover:bg-slate-50/50 cursor-pointer" onClick={() => onSelect(sim.id)}>
              <TableCell className="font-semibold text-slate-800">
                {sim.name}
              </TableCell>
              <TableCell>
                {getStatusBadge(sim.status)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">
                  {sim.basis}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-bold text-indigo-600">
                Rp {sim.pmValue?.toLocaleString('id-ID') || 0}
              </TableCell>
              <TableCell className="text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {format(sim.createdAt, 'dd MMM yyyy')}
                </div>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1.5"
                    onClick={() => onSelect(sim.id)}
                  >
                    Open <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-destructive"
                    onClick={() => onDelete(sim.id)}
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
