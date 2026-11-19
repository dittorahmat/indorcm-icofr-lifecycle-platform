import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MOCK_DEPARTMENTS } from '@shared/mock-data';
import { Settings, User } from '@shared/types';
import { can } from '@shared/entity-authority';
import { useActiveSimulation, useSimulationSnapshot } from '@/hooks/use-bpm';
import { useBPMAssertions } from './useBPMAssertions';

interface UseBpmScopingSelectionArgs {
  viewYear: string;
  searchParams: URLSearchParams;
  /** Access fallbacks the caller localizes — this hook owns no copy. */
  departmentFallback: string;
  unassignedLabel: string;
}

/**
 * FSLI / GL-account selection and everything derived from it — the significant
 * FSLI list, GL numbers, the selected GL row, department access — plus the
 * account-level assertion draft from `useBPMAssertions`.
 *
 * Knows nothing about the BPM process tree or the diagram list; the page
 * composes those from `useBpmProcessHierarchy`.
 */
export function useBpmScopingSelection({
  viewYear,
  searchParams,
  departmentFallback,
  unassignedLabel,
}: UseBpmScopingSelectionArgs) {
  const [selectedFsli, setSelectedFsli] = React.useState('');
  const [selectedAccountKey, setSelectedAccountKey] = React.useState('');

  const { data: activeSim, isLoading: simLoading } = useActiveSimulation(viewYear);
  const { data: activeSnap, isLoading: snapLoading } = useSimulationSnapshot(activeSim?.glSnapshotId);

  // Deep link handed over from the Scoping page.
  React.useEffect(() => {
    const fsli = searchParams.get('fsli');
    const noGL = searchParams.get('noGL');
    const glDesc = searchParams.get('glDesc');

    let resolvedFsli = fsli;
    if (noGL && activeSnap?.rows) {
      const matchedRow = activeSnap.rows.find((row) => row.noGL === noGL);
      if (matchedRow?.fsliName) resolvedFsli = matchedRow.fsliName;
    }

    if (resolvedFsli) setSelectedFsli(resolvedFsli);
    if (noGL && glDesc) setSelectedAccountKey(`${noGL} ||| ${glDesc}`);
  }, [searchParams, activeSnap]);

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const glLookupMap = React.useMemo(() => {
    if (!activeSnap?.rows) return new Map<string, string>();
    const map = new Map<string, string>();
    activeSnap.rows.forEach((row) => {
      if (row.glDesc && row.fsliName) map.set(`desc:${row.glDesc}`, row.fsliName);
      if (row.noGL && row.fsliName) map.set(`no:${row.noGL}`, row.fsliName);
    });
    return map;
  }, [activeSnap]);

  const fsliNoUrutMap = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!activeSnap?.rows) return map;
    activeSnap.rows.forEach((row) => {
      if (row.fsliName) {
        const currentMin = map.get(row.fsliName) ?? 999999;
        const rowNoUrut = row.noUrut ?? 999999;
        if (rowNoUrut < currentMin) map.set(row.fsliName, rowNoUrut);
      }
    });
    return map;
  }, [activeSnap]);

  const significantFsliNames = React.useMemo(() => {
    const names = new Set<string>();
    activeSim?.significantAccounts?.forEach((account) => {
      if (!account.name) return;
      const fromMap = glLookupMap.get(`desc:${account.name}`) || glLookupMap.get(`no:${account.fsliCode}`);
      names.add(fromMap || account.name);
    });
    const urlFsli = searchParams.get('fsli');
    if (urlFsli) names.add(urlFsli);
    return Array.from(names).sort((a, b) => {
      const orderA = fsliNoUrutMap.get(a) ?? 999999;
      const orderB = fsliNoUrutMap.get(b) ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [activeSim, glLookupMap, fsliNoUrutMap, searchParams]);

  const glNumbers = React.useMemo(() => {
    if (!activeSnap?.rows || !selectedFsli) return [];
    const accounts: { key: string; noGL: string; glDesc: string }[] = [];
    const seen = new Set<string>();
    activeSnap.rows
      .filter((row) => (row.fsliName || '').trim().toLowerCase() === selectedFsli.trim().toLowerCase())
      .forEach((row) => {
        const key = `${row.noGL} ||| ${row.glDesc}`;
        if (!seen.has(key)) {
          seen.add(key);
          accounts.push({ key, noGL: row.noGL, glDesc: row.glDesc });
        }
      });
    return accounts.sort((a, b) => a.noGL.localeCompare(b.noGL));
  }, [activeSnap, selectedFsli]);

  const selectedGLRow = React.useMemo(() => {
    if (!selectedAccountKey || !activeSnap?.rows) return null;
    const [noGL, glDesc] = selectedAccountKey.split(' ||| ');
    return activeSnap.rows.find((row) => row.noGL === noGL && row.glDesc === glDesc);
  }, [selectedAccountKey, activeSnap]);

  const { departmentName, hasAccess } = React.useMemo(() => {
    if (!selectedGLRow || !activeSim || !currentUser) {
      return { hasAccess: true, departmentName: departmentFallback };
    }
    const assignment = activeSim.significantAccounts?.find(
      (account) => account.name === selectedGLRow.fsliName || (account.fsliCode && account.fsliCode === selectedGLRow.fsliCode),
    );
    const deptIds = assignment?.assignedDepartmentIds || [];
    const deptName =
      deptIds.length > 0
        ? deptIds.map((id) => MOCK_DEPARTMENTS.find((d) => d.id === id)?.name).filter(Boolean).join(', ')
        : unassignedLabel;
    if (can(currentUser.role, 'scoping:allocate-departments')) {
      return { departmentName: deptName, hasAccess: true };
    }
    const match = !!currentUser.departmentId && deptIds.includes(currentUser.departmentId);
    return { departmentName: deptName, hasAccess: match };
  }, [selectedGLRow, activeSim, currentUser, departmentFallback, unassignedLabel]);

  const assertions = useBPMAssertions(selectedFsli, selectedAccountKey);

  return {
    selectedFsli,
    setSelectedFsli,
    selectedAccountKey,
    setSelectedAccountKey,
    activeSim,
    simLoading,
    activeSnap,
    snapLoading,
    settings,
    significantFsliNames,
    glNumbers,
    selectedGLRow,
    departmentName,
    hasAccess,
    assertions,
  };
}
