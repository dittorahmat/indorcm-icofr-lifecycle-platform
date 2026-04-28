import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface AddVendorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVendorDialog({ isOpen, onOpenChange }: AddVendorDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState({
    name: '',
    serviceType: '',
    contactPerson: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor added successfully');
      onOpenChange(false);
      setFormData({ name: '', serviceType: '', contactPerson: '' });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Register a third-party service provider for SOC monitoring.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Vendor Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Amazon Web Services" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service">Service Type</Label>
            <Input 
              id="service" 
              placeholder="e.g. Cloud Infrastructure" 
              value={formData.serviceType}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Contact Person</Label>
            <Input 
              id="contact" 
              placeholder="Full name or email" 
              value={formData.contactPerson}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            disabled={!formData.name || mutation.isPending}
            onClick={() => mutation.mutate(formData)}
          >
            {mutation.isPending ? "Saving..." : "Save Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
