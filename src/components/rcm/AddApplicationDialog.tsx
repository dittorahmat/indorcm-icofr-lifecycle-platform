import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ITGCArea, Application, Department } from '@shared/types';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { FileUp, FileText, X } from 'lucide-react';

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
  const [isSignificant, setIsSignificant] = React.useState(false);
  const [selectedAreas, setSelectedAreas] = React.useState<ITGCArea[]>([]);
  const [businessOwners, setBusinessOwners] = React.useState<string[]>([]);
  const [applicationOwners, setApplicationOwners] = React.useState<string[]>([]);
  const [architectureDocUrl, setArchitectureDocUrl] = React.useState<string | null>(null);
  const [architectureDocName, setArchitectureDocName] = React.useState<string | null>(null);

  // Fetch registered departments for searchable dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ items: Department[] }>('/api/departments'),
  });

  const deptOptions: Option[] = React.useMemo(() => {
    if (!departmentsData?.items) return [];
    return departmentsData.items.map(d => ({
      label: d.name,
      value: d.name
    }));
  }, [departmentsData]);

  // Sync state with initialData when it changes
  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setCriticality((initialData.criticality as any) || "Medium");
      setIsSignificant(!!initialData.isSignificant);
      setSelectedAreas((initialData.itgcAreas as any) || []);
      setBusinessOwners((initialData.businessOwners as any) || []);
      setApplicationOwners((initialData.applicationOwners as any) || []);
      setArchitectureDocUrl(initialData.architectureDocUrl || null);
      setArchitectureDocName(initialData.architectureDocName || null);
    } else {
      setName("");
      setDescription("");
      setCriticality("Medium");
      setIsSignificant(false);
      setSelectedAreas([]);
      setBusinessOwners([]);
      setApplicationOwners([]);
      setArchitectureDocUrl(null);
      setArchitectureDocName(null);
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
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save application");
    }
  });

  const handleSubmit = () => {
    if (!name) return;
    mutation.mutate({ 
      name, 
      description, 
      criticality, 
      isSignificant,
      itgcAreas: selectedAreas,
      businessOwners,
      applicationOwners,
      architectureDocUrl,
      architectureDocName
    });
  };

  const toggleArea = (area: ITGCArea) => {
    setSelectedAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchitectureDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setArchitectureDocUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Application' : 'Add New Application'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update IT asset details, owners, and ITGC mapping.' 
              : 'Register a new IT asset into the central library.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-xs">
          <div className="grid gap-2">
            <Label htmlFor="name">Application Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SAP S/4HANA" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex-wrap gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="icofr-scope" className="font-semibold text-slate-800">ICOFR Scope (Significant)</Label>
              <p className="text-slate-500 text-xs">Mark application as in-scope for ICOFR financial reporting.</p>
            </div>
            <Switch
              id="icofr-scope"
              checked={isSignificant}
              onCheckedChange={setIsSignificant}
            />
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

          {/* Business Owner (Searchable Multi-select) */}
          <div className="grid gap-2">
            <Label>Business Owner (Department)</Label>
            <MultiSelect
              options={deptOptions}
              selected={businessOwners}
              onChange={setBusinessOwners}
              placeholder="Select Business Owner department(s)..."
              onCreateNew={(name) => {
                if (!businessOwners.includes(name)) {
                  setBusinessOwners([...businessOwners, name]);
                }
              }}
            />
          </div>

          {/* Application Owner (Searchable Multi-select) */}
          <div className="grid gap-2">
            <Label>Application Owner (Department)</Label>
            <MultiSelect
              options={deptOptions}
              selected={applicationOwners}
              onChange={setApplicationOwners}
              placeholder="Select Application Owner department(s)..."
              onCreateNew={(name) => {
                if (!applicationOwners.includes(name)) {
                  setApplicationOwners([...applicationOwners, name]);
                }
              }}
            />
          </div>

          {/* Application Architecture (Upload PDF) */}
          <div className="grid gap-2">
            <Label>Application Architecture (File PDF/Doc)</Label>
            {architectureDocName ? (
              <div className="flex items-center justify-between p-2.5 rounded-md border border-indigo-200 bg-indigo-50/50 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-indigo-700 font-medium truncate">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{architectureDocName}</span>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-destructive"
                  onClick={() => {
                    setArchitectureDocUrl(null);
                    setArchitectureDocName(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 cursor-pointer transition-colors text-slate-600">
                <FileUp className="h-4 w-4 text-slate-500" />
                <span>Upload Architecture Document (PDF/Doc)</span>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.png,.jpg" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            )}
          </div>

          <div className="grid gap-2">
            <Label>ITGC Areas (Table 1 Mapping)</Label>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-4 gap-y-3 mt-1 bg-slate-50 p-3 rounded-md border border-slate-100">
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
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-h-[44px]">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || mutation.isPending} className="w-full sm:w-auto min-h-[44px]">
            {mutation.isPending ? "Saving..." : (initialData ? "Save Changes" : "Add Application")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
