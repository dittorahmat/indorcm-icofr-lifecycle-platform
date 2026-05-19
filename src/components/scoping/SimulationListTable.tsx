import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, Eye, LayoutGrid, Clock, ChevronRight, Loader2, MapPin
} from 'lucide-react';
import { MaterialitySimulation, SimulationStatus, GLSnapshot } from '@shared/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SignificantLocationModal } from './SignificantLocationModal';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

import { useSimulationSnapshot } from '@/hooks/use-bpm';

interface SimulationListTableProps {
  data: MaterialitySimulation[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function SimulationListTable({ data, onSelect, onDelete, isLoading }: SimulationListTableProps) {
  const [locModalOpen, setLocModalOpen] = React.useState(false);
  const [selectedSim, setSelectedSim] = React.useState<MaterialitySimulation | null>(null);

  // Fetch Snapshot linked to the selected simulation (for the modal)
  const { data: linkedSnap } = useSimulationSnapshot(selectedSim?.glSnapshotId);

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
      case 'Approved': return <Badge className="bg-green-600 font-bold px-3">Approved</Badge>;
      case 'Pending CFO': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 font-bold px-3">Review CFO</Badge>;
      case 'Pending Komut': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-bold px-3">Review Komut</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="font-bold px-3">Rejected</Badge>;
      default: return <Badge variant="outline" className="font-bold px-3">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden shadow-md bg-white">
      <Table>
        <TableHeader className="bg-slate-50 border-b">
          <TableRow>
            <TableHead className="font-bold text-slate-700 h-14 px-6">Simulation Name</TableHead>
            <TableHead className="font-bold text-slate-700 h-14">Status</TableHead>
            <TableHead className="font-bold text-slate-700 h-14">Basis</TableHead>
            <TableHead className="text-right font-bold text-slate-700 h-14">PM Value</TableHead>
            <TableHead className="font-bold text-slate-700 h-14">Significant Location</TableHead>
            <TableHead className="font-bold text-slate-700 h-14">Created Date</TableHead>
            <TableHead className="text-right font-bold text-slate-700 h-14 px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((sim) => (
            <TableRow key={sim.id} className="group hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => onSelect(sim.id)}>
              <TableCell className="font-bold text-slate-900 px-6">
                {sim.name}
              </TableCell>
              <TableCell>
                {getStatusBadge((sim.workflowStatus || sim.status) as SimulationStatus)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs font-black uppercase tracking-widest border-slate-300">
                  {sim.basis}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-black text-[#417dc1]">
                Rp {sim.pmValue?.toLocaleString('id-ID') || 0}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "h-8 text-xs gap-2 font-black uppercase tracking-tight transition-all",
                    sim.locationResults 
                      ? "border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100" 
                      : "border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
                  )}
                  onClick={() => {
                    setSelectedSim(sim);
                    setLocModalOpen(true);
                  }}
                >
                  <MapPin className="h-3.5 w-3.5" /> 
                  {sim.locationResults ? `${sim.locationResults.filter(r => r.isSignificant).length} Significant` : "Analyze Locations"}
                </Button>
              </TableCell>
              <TableCell className="text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3 w-3" />
                  {format(sim.createdAt, 'dd MMM yyyy')}
                </div>
              </TableCell>
              <TableCell className="text-right px-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1.5 font-bold hover:bg-blue-50 hover:text-[#417dc1]"
                    onClick={() => onSelect(sim.id)}
                  >
                    Details <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-300 hover:text-red-600 transition-colors"
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

      {selectedSim && (
        <SignificantLocationModal 
          simulation={selectedSim}
          activeSnapshot={linkedSnap || null}
          open={locModalOpen}
          onOpenChange={setLocModalOpen}
        />
      )}
    </div>
  );
}
