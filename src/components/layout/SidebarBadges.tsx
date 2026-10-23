import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { can } from '@shared/entity-authority';
import { allowedRolesAt } from '@shared/workflow-transitions';
import { resolveSimulationStatus, simulationApprovalStages } from '@shared/scoping-simulation-status';
import type { MaterialitySimulation, UserRole } from '@shared/types';

/**
 * The two sidebar badges. Each owns its query and its threshold so the nav data
 * only names a slot (`badge: 'approvals' | 'notifications'`).
 */
export function PendingApprovalBadge({ role }: { role: UserRole | undefined }) {
  const { data: simulations } = useQuery({
    queryKey: ['simulations-pending-badge'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
    enabled: can(role, 'scoping:view-approvals'),
    refetchInterval: 30000,
  });

  // Same queue as ApprovalPage: stages and authority come from the SCOPING table.
  const stages = simulationApprovalStages();
  const count = role
    ? (simulations?.items.filter((simulation) => {
        const status = resolveSimulationStatus(simulation);
        return stages.includes(status) && allowedRolesAt('SCOPING', status).includes(role);
      }).length ?? 0)
    : 0;

  if (count === 0) return null;

  return (
    <div className="h-5 min-w-[1.25rem] px-1 rounded bg-red-600 text-xs font-semibold text-white flex items-center justify-center">
      {count}
    </div>
  );
}

export function NotificationBadge() {
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api<{ count: number }>('/api/notifications/unread-count'),
    refetchInterval: 30000,
  });

  if (!notificationData?.count || notificationData.count <= 0) return null;

  return (
    <div className="h-5 min-w-[1.25rem] px-1 rounded bg-rose-700 text-xs font-semibold text-white flex items-center justify-center">
      {notificationData.count > 9 ? '9+' : notificationData.count}
    </div>
  );
}
