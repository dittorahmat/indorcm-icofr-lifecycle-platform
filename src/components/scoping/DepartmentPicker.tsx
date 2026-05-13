import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department } from '@shared/types';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

interface DepartmentPickerProps {
  departments: Department[];
  selectedId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

export function DepartmentPicker({ 
  departments, 
  selectedId, 
  onSelect, 
  disabled = false,
  className 
}: DepartmentPickerProps) {
  return (
    <Select 
      value={selectedId || "unassigned"} 
      onValueChange={(val) => onSelect(val === "unassigned" ? "" : val)}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        "h-7 w-full text-xs px-2 bg-transparent border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all",
        !selectedId && "text-slate-400 italic",
        selectedId && "text-indigo-700 font-semibold border-indigo-200 bg-indigo-50",
        className
      )}>
        <div className="flex items-center gap-1.5 truncate">
          <Building2 className={cn("h-3 w-3", selectedId ? "text-indigo-500" : "text-slate-300")} />
          <SelectValue placeholder="Assign Dept..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned" className="text-xs italic text-slate-400">
          Not Assigned
        </SelectItem>
        {departments.map((dept) => (
          <SelectItem key={dept.id} value={dept.id} className="text-xs font-medium">
            {dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
