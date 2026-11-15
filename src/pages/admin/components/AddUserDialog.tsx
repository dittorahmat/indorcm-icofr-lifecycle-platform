import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { USER_ROLE_OPTIONS, USER_LEVEL_OPTIONS } from '../../../../shared/role-options';

interface Department {
  id: string;
  name: string;
}

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export function AddUserDialog({
  isOpen,
  onOpenChange,
  departments,
  onSubmit,
}: AddUserDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full sm:w-auto min-h-[44px]">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter new personnel account and select department.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-add-name">Full Name</Label>
              <Input id="user-add-name" name="name" autoComplete="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-add-email">BUMN Email</Label>
              <Input id="user-add-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-add-password">Password</Label>
              <Input
                id="user-add-password"
                name="password"
                type="password"
                autoComplete="new-password"
                defaultValue="password123"
                required
              />
            </div>
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select name="role" defaultValue="Line 1">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USER_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey, { defaultValue: option.fallback })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Level</Label>
                <Select name="level" defaultValue="Staff">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USER_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey, { defaultValue: option.fallback })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <Select name="departmentId">
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px]">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
