import React from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAccountAssertions } from '@/hooks/use-bpm';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { toast } from 'sonner';
import type { AccountAssertion } from '@shared/types';

export function useBPMAssertions(selectedFsli: string, selectedAccountKey: string) {
  const queryClient = useQueryClient();
  const noGL = selectedAccountKey ? selectedAccountKey.split(' ||| ')[0] : '';

  const { assertion: accountAssertion, isLoading: assertionLoading } = useAccountAssertions(
    selectedFsli,
    noGL
  );

  const [localAssertion, setLocalAssertion] = React.useState<Partial<AccountAssertion>>({});

  React.useEffect(() => {
    if (accountAssertion !== undefined) {
      if (accountAssertion === null) {
        setLocalAssertion({
          assertionE: 'N', assertionC: 'N', assertionA: 'N',
          assertionCo: 'N', assertionRo: 'N', assertionVa: 'N',
          assertionPd: 'N'
        });
      } else {
        setLocalAssertion(accountAssertion);
      }
    }
  }, [accountAssertion]);

  const updateAssertionMutation = useMutation({
    mutationFn: (data: Partial<AccountAssertion>) => api('/api/account-assertions', {
      method: 'POST',
      body: JSON.stringify({
        fsliName: selectedFsli,
        noGL,
        ...data
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-assertions'] });
      toast.success("Account assertions updated");
    }
  });

  const isAssertionDirty = React.useMemo(() => {
    if (!accountAssertion) {
      return Object.values(localAssertion).some(v => v === 'Y');
    }
    return (
      localAssertion.assertionE !== (accountAssertion.assertionE || 'N') ||
      localAssertion.assertionC !== (accountAssertion.assertionC || 'N') ||
      localAssertion.assertionA !== (accountAssertion.assertionA || 'N') ||
      localAssertion.assertionCo !== (accountAssertion.assertionCo || 'N') ||
      localAssertion.assertionRo !== (accountAssertion.assertionRo || 'N') ||
      localAssertion.assertionVa !== (accountAssertion.assertionVa || 'N') ||
      localAssertion.assertionPd !== (accountAssertion.assertionPd || 'N')
    );
  }, [localAssertion, accountAssertion]);

  useUnsavedChanges(isAssertionDirty);

  const handleAssertionChange = (field: keyof AccountAssertion, value: string) => {
    setLocalAssertion(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAssertions = () => {
    updateAssertionMutation.mutate(localAssertion);
  };

  return {
    localAssertion,
    setLocalAssertion,
    accountAssertion,
    assertionLoading,
    isAssertionDirty,
    updateAssertionMutation,
    handleAssertionChange,
    handleSaveAssertions
  };
}
