import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, LayoutGrid, Clock, ChevronRight, ChevronDown, ChevronUp, Loader2, MapPin
} from 'lucide-react';
import { MaterialitySimulation, SimulationStatus } from '@shared/types';
import { resolveSimulationStatus } from '@shared/scoping-simulation-status';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { SignificantLocationModal } from './SignificantLocationModal';

import { useSimulationSnapshot } from '@/hooks/use-bpm';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { formatIDR } from '@/components/reports/dod/dod-format';

interface SimulationListTableProps {
  data: MaterialitySimulation[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function SimulationListTable({ data, onSelect, onDelete, isLoading }: SimulationListTableProps) {
  const { t } = useTranslation(['common', 'workflow']);
  const [locModalOpen, setLocModalOpen] = React.useState(false);
  const [selectedSim, setSelectedSim] = React.useState<MaterialitySimulation | null>(null);
  const [showFullTable, setShowFullTable] = React.useState(false);

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
      case 'Pending Deletion Approval': return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200 font-bold px-3">Pending Deletion</Badge>;
      case 'Pending Update Approval': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 font-bold px-3">Pending Update</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="font-bold px-3">Rejected</Badge>;
      default: return <Badge variant="outline" className="font-bold px-3">{status}</Badge>;
    }
  };

  // `status` is authoritative; `workflowStatus` is the legacy mirror.
  const rows = data.map((sim) => ({ sim, status: resolveSimulationStatus(sim) }));

  return (
    <>
      <MobileDesktopBanner recordCount={data.length} />
      <div className="md:hidden space-y-3" data-testid="simulation-mobile-cards">
        {rows.map(({ sim, status }) => (
          <div key={sim.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-w-0 flex-1">{sim.name}</p>
              {getStatusBadge(status)}
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">{sim.basis}</span>
              <span className="font-mono text-xs font-bold text-[#417dc1]">{formatIDR(sim.pmValue ?? 0)}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" className="flex-1 min-h-[44px] text-xs font-bold" onClick={() => onSelect(sim.id)}>
                Details <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete simulation"
                disabled={status === 'Pending Deletion Approval'}
                title={status === 'Approved' ? t('workflow:requestDeletion', { defaultValue: 'Request Deletion' }) : t('common:actions.delete', { defaultValue: 'Delete' })}
                className="min-h-[44px] min-w-[44px] text-slate-300 hover:text-red-600 disabled:opacity-30"
                onClick={() => onDelete(sim.id)}
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
      <div className={`border rounded-xl shadow-md bg-white max-w-full overflow-x-auto overscroll-x-contain touch-pan-x table-scroll-hint ${showFullTable ? 'block' : 'hidden'} md:block`}>
      <Table>
        <TableHeader>
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
          {rows.map(({ sim, status }) => (
            <TableRow key={sim.id} className="group hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => onSelect(sim.id)}>
              <TableCell className="font-bold text-slate-900 px-6">
                {sim.name}
              </TableCell>
              <TableCell>
                {getStatusBadge(status)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs font-black uppercase tracking-widest border-slate-300">
                  {sim.basis}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-black text-[#417dc1]">
                {formatIDR(sim.pmValue ?? 0)}
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
                <div className="flex flex-wrap justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="min-h-[44px] gap-1.5 font-bold hover:bg-blue-50 hover:text-[#417dc1]"
                    onClick={() => onSelect(sim.id)}
                  >
                    Details <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={status === 'Pending Deletion Approval'}
                    title={status === 'Approved' ? t('workflow:requestDeletion', { defaultValue: 'Request Deletion' }) : t('common:actions.delete', { defaultValue: 'Delete' })}
                    className="min-h-[44px] min-w-[44px] text-slate-300 hover:text-red-600 transition-colors disabled:opacity-30"
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
    </>
  );
}
