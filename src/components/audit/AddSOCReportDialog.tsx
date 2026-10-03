import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Vendor } from '@shared/types';

interface AddSOCReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSOCReportDialog({ isOpen, onOpenChange }: AddSOCReportDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState({
    vendorId: '',
    reportType: 'SOC 1 Type 2',
    periodStart: '',
    periodEnd: '',
    fileUrl: '',
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api<{ items: Vendor[] }>('/api/vendors'),
  });
  const vendors = vendorsData?.items || [];

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api('/api/soc-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soc-reports'] });
      toast.success('SOC Report added successfully');
      onOpenChange(false);
      setFormData({
        vendorId: '',
        reportType: 'SOC 1 Type 2',
        periodStart: '',
        periodEnd: '',
        fileUrl: '',
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register SOC Report</DialogTitle>
          <DialogDescription>
            Record metadata and link for a third-party assurance report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Vendor</Label>
            <Select 
              value={formData.vendorId} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, vendorId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors?.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Report Type</Label>
            <Input 
              id="type" 
              value={formData.reportType}
              onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start">Period Start</Label>
              <Input 
                id="start" 
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData(prev => ({ ...prev, periodStart: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">Period End</Label>
              <Input 
                id="end" 
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, periodEnd: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">Report URL / Link</Label>
            <Input 
              id="url" 
              placeholder="Link to SharePoint or Drive" 
              value={formData.fileUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] rounded-md">Cancel</Button>
          <Button
            disabled={!formData.vendorId || !formData.periodEnd || mutation.isPending}
            onClick={() => mutation.mutate(formData)}
            className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] rounded-md"
          >
            {mutation.isPending ? "Saving..." : "Save Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
