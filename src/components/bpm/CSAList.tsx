import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Printer, FileText, LayoutDashboard, Trash2, RefreshCw, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { CSARecord } from '@shared/types';
import { formatCsaReference } from '@/lib/csa-utils';

interface CSAListProps {
  items: CSARecord[];
  isLoading: boolean;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string, layout: 'detailed' | 'summary') => void;
  onNewAssessment: () => void;
  bpmCode?: string;
  noGL?: string;
  bpmProcessId?: string;
  year?: string | number;
}

export function CSAList({ 
  items, 
  isLoading, 
  onViewDetail, 
  onDelete, 
  onPrint, 
  onNewAssessment,
  bpmCode,
  noGL,
  bpmProcessId,
  year
}: CSAListProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Assessment History</h3>
        <Button 
          onClick={onNewAssessment} 
          className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> New Assessment
        </Button>
      </div>
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-xs font-black uppercase">Reference & Period</TableHead>
            <TableHead className="text-xs font-black uppercase text-center">Result</TableHead>
            <TableHead className="text-xs font-black uppercase">Date</TableHead>
            <TableHead className="text-right text-xs font-black uppercase">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center"><RefreshCw className="animate-spin inline-block mr-2" /> Loading...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">No history found.</TableCell></TableRow>
          ) : items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-bold text-xs">
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                    {formatCsaReference({
                      bpmCode,
                      noGL,
                      bpmProcessId: item.bpmProcessId || bpmProcessId,
                      year: year || new Date(item.assessmentDate).getFullYear(),
                      period: item.period
                    })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.period}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn(
                "text-xs font-black uppercase",
                item.result === 'Effective' ? "bg-green-600" : "bg-red-600"
                )}>{item.result}</Badge>              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {new Date(item.assessmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {' '}
                {new Date(item.assessmentDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onViewDetail(item.id)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-7 w-7 text-indigo-600 border-indigo-200">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer" onClick={() => onPrint(item.id, 'detailed')}>
                        <FileText className="h-3.5 w-3.5" /> Export Appendix 7a (Detailed)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-bold gap-2 cursor-pointer" onClick={() => onPrint(item.id, 'summary')}>
                        <LayoutDashboard className="h-3.5 w-3.5" /> Export Appendix 7a (Summary)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-slate-300 hover:text-red-600 hover:bg-red-50" 
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
