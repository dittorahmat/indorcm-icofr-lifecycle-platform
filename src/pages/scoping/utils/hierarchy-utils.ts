import { GLRow } from "@shared/types";

export interface EntityNode {
  code: string;
  name: string;
  parentId: string | null;
  balance: number;
  children: EntityNode[];
}

/**
 * Builds a hierarchy tree from a list of GL rows.
 */
export function buildEntityHierarchy(rows: GLRow[]): EntityNode[] {
  const entityMap = new Map<string, EntityNode>();
  
  // First pass: Identify all unique entities and their balances
  rows.forEach(row => {
    const code = row.entityCode || 'UNKNOWN';
    if (!entityMap.has(code)) {
      entityMap.set(code, {
        code,
        name: `Entity ${code}`, // Default name, can be updated later
        parentId: row.parentEntityCode || null,
        balance: 0,
        children: []
      });
    }
    entityMap.get(code)!.balance += row.balance || 0;
  });

  const roots: EntityNode[] = [];
  
  // Second pass: Link children to parents
  entityMap.forEach(node => {
    if (node.parentId && entityMap.has(node.parentId)) {
      entityMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Calculates roll-up balances recursively.
 * Child balances are added to their parent's balance.
 */
export function calculateRollupBalances(nodes: EntityNode[]): void {
  nodes.forEach(node => {
    if (node.children.length > 0) {
      calculateRollupBalances(node.children);
      const childrenTotal = node.children.reduce((sum, child) => sum + child.balance, 0);
      node.balance += childrenTotal;
    }
  });
}

/**
 * Flatten tree to get all descendant codes.
 */
export function getAllDescendantCodes(node: EntityNode): string[] {
  let codes = [node.code];
  node.children.forEach(child => {
    codes = [...codes, ...getAllDescendantCodes(child)];
  });
  return codes;
}
