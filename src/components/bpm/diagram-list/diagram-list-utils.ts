import type { BPMDiagram, BPMProcess, BPMProcessWithChildren } from '@shared/types';

export function countAllProcesses(roots: BPMProcessWithChildren[]): number {
  let count = 0;
  roots.forEach((root) => {
    count += 1;
    if (root.children) count += root.children.length;
  });
  return count;
}

export function findDiagramFor(
  diagrams: { items: BPMDiagram[] } | undefined,
  proc: BPMProcess,
): BPMDiagram | undefined {
  return diagrams?.items.find((d) => d.subProcess === proc.name || d.name === proc.name);
}

export function resolveDiagramTarget(
  diagrams: { items: BPMDiagram[] } | undefined,
  proc: BPMProcess,
): { mode: 'open'; diagramId: string } | { mode: 'create' } {
  const diagram = findDiagramFor(diagrams, proc);
  if (diagram) return { mode: 'open', diagramId: diagram.id };
  return { mode: 'create' };
}
