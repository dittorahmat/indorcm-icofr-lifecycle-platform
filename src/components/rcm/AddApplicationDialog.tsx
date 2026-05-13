import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ITGCArea, Application } from '@shared/types';

interface AddApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Application | null;
}

const ITGC_AREAS: ITGCArea[] = [
  "Access to Program and Data",
  "Program Development",
  "Program Changes",
  "Computer Operations"
];

export function AddApplicationDialog({ isOpen, onOpenChange, initialData }: AddApplicationDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [criticality, setCriticality] = React.useState<"High" | "Medium" | "Low">("Medium");
  const [selectedAreas, setSelectedAreas] = React.useState<ITGCArea[]>([]);

  // Sync state with initialData when it changes
  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setCriticality((initialData.criticality as any) || "Medium");
      setSelectedAreas((initialData.itgcAreas as any) || []);
    } else {
      setName("");
      setDescription("");
      setCriticality("Medium");
      setSelectedAreas([]);
    }
  }, [initialData, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const isEdit = !!initialData;
      const url = isEdit ? `/api/applications/${initialData.id}` : '/api/applications';
      const method = isEdit ? 'PATCH' : 'POST';
      
      return api(url, {
        method,
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(initialData ? "Application updated" : "Application added to library");
      onOpenChange(false);
    }
  });

  const handleSubmit = () => {
    if (!name) return;
    mutation.mutate({ 
      name, 
      description, 
      criticality, 
      itgcAreas: selectedAreas 
    });
  };

  const toggleArea = (area: ITGCArea) => {
    setSelectedAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Application' : 'Add New Application'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update IT asset details and ITGC mapping.' 
              : 'Register a new IT asset into the central library.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Application Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SAP S/4HANA" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Main ERP for finance..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="crit">Criticality</Label>
            <Select value={criticality} onValueChange={(v: any) => setCriticality(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>ITGC Areas (Table 1 Mapping)</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2 bg-slate-50 p-3 rounded-md border border-slate-100">
              {ITGC_AREAS.map(area => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`add-app-${area}`} 
                    checked={selectedAreas.includes(area)}
                    onCheckedChange={() => toggleArea(area)}
                  />
                  <label 
                    htmlFor={`add-app-${area}`}
                    className="text-xs font-medium leading-tight cursor-pointer text-slate-700"
                  >
                    {area}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || mutation.isPending}>
            {mutation.isPending ? "Saving..." : (initialData ? "Save Changes" : "Add Application")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
