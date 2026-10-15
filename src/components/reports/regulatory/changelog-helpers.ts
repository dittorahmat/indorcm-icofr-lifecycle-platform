import type { ChangeLog } from '@shared/types';

function text(value: unknown, fallback = '-'): string {
  return typeof value === 'string' && value !== '' ? value : fallback;
}

function payloadOf(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export interface ChangeLogRowMeta {
  process: string;
  subProcess: string;
  descBefore: string;
  descAfter: string;
  refBefore: string;
  refAfter: string;
  owner: string;
}

export function changeLogRowMeta(log: Pick<ChangeLog, 'dataBefore' | 'dataAfter' | 'descriptionBefore' | 'descriptionAfter'>): ChangeLogRowMeta {
  const before = payloadOf(log.dataBefore);
  const after = payloadOf(log.dataAfter);
  return {
    process: text(after.process ?? before.process),
    subProcess: text(after.subProcess ?? before.subProcess),
    descBefore: text(before.controlDescription ?? before.riskDescription ?? log.descriptionBefore),
    descAfter: text(after.controlDescription ?? after.riskDescription ?? log.descriptionAfter),
    refBefore: text(before.controlId ?? before.id),
    refAfter: text(after.controlId ?? after.id),
    owner: text(after.executingFunction ?? after.executorRole ?? before.executingFunction),
  };
}

export function sortChangeLogsDesc<T extends Pick<ChangeLog, 'timestamp'>>(logs: readonly T[]): T[] {
  return [...logs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
