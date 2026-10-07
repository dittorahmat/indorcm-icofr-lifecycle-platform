import type { BPMProcess, BPMProcessWithChildren } from '@shared/types';

export function buildProcessTree(
  items: BPMProcess[],
  searchTerm = ""
): BPMProcessWithChildren[] {
  const itemMap = new Map<string, BPMProcessWithChildren>();
  const rootItems: BPMProcessWithChildren[] = [];

  // Initialize map with copies and empty children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build tree hierarchy
  items.forEach(item => {
    const current = itemMap.get(item.id);
    if (!current) return;
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(current);
      }
    } else {
      rootItems.push(current);
    }
  });

  if (!searchTerm.trim()) {
    return rootItems;
  }

  const query = searchTerm.toLowerCase().trim();
  const filterNode = (node: BPMProcessWithChildren): BPMProcessWithChildren | null => {
    const nameMatches = node.name.toLowerCase().includes(query) || (node.bpmCode && node.bpmCode.toLowerCase().includes(query));
    const matchingChildren: BPMProcessWithChildren[] = [];

    if (node.children) {
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          matchingChildren.push(filteredChild);
        }
      }
    }

    if (nameMatches || matchingChildren.length > 0) {
      return {
        ...node,
        children: nameMatches ? (node.children || []) : matchingChildren
      };
    }
    return null;
  };

  return rootItems
    .map(filterNode)
    .filter((node): node is BPMProcessWithChildren => node !== null);
}
