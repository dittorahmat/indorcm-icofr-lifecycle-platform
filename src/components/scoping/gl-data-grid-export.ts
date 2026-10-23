import { isAccountInScope, isAccountQuantitativelySignificant } from '@shared/scoping-materiality';
import type { Department, GLRow } from '@shared/types';

/**
 * The significant-account worksheet's Excel projection, extracted from
 * `GLDataGrid` so it can be tested without React.
 *
 * Significance is not recomputed here: it comes from the row's
 * `scopeClassification` (one owner: `shared/scoping-materiality.ts`). The
 * previous inline builder compared `|balance| >= PM`, which dropped the
 * FSLI-total rule and the qualitative rule the grid itself rendered.
 */
export interface GlExportLabels {
  entityCode: string;
  fsli: string;
  accountCode: string;
  accountDesc: string;
  balance: string;
  quantitative: string;
  owner: string;
  acceptance: string;
  scope: string;
  significant: string;
  notSignificant: string;
  inScope: string;
  outScope: string;
  pending: string;
  unassigned: string;
}

export interface GlExportInput {
  rows: readonly GLRow[];
  pmValue: number;
  departments: readonly Pick<Department, 'id' | 'name'>[];
  labels: GlExportLabels;
}

export type GlExportRow = Record<string, string | number>;

/** One `[FSLI]` separator row per FSLI, followed by that FSLI's accounts. */
export function buildGlExportRows({
  rows,
  pmValue,
  departments,
  labels,
}: GlExportInput): GlExportRow[] {
  const groups = new Map<string, GLRow[]>();
  for (const row of rows) {
    const fsliName = row.fsliName || '';
    const bucket = groups.get(fsliName);
    if (bucket) bucket.push(row);
    else groups.set(fsliName, [row]);
  }

  const departmentName = (id: string) => departments.find((dept) => dept.id === id)?.name;
  const output: GlExportRow[] = [];

  for (const [fsliName, leaves] of groups) {
    const explicitTotal = leaves.find(
      (leaf) => leaf.fsliBalance !== undefined && leaf.fsliBalance !== null && leaf.fsliBalance !== 0,
    )?.fsliBalance;
    const balance = explicitTotal ?? leaves.reduce((sum, leaf) => sum + (leaf.balance ?? 0), 0);
    const inScope =
      leaves.some((leaf) => isAccountInScope(leaf, pmValue)) || Math.abs(balance) >= pmValue;
    const quantitativelySignificant =
      Math.abs(balance) >= pmValue ||
      leaves.some((leaf) => isAccountQuantitativelySignificant(leaf, pmValue));

    output.push({
      [labels.entityCode]: '',
      [labels.fsli]: `[FSLI] ${fsliName}`,
      [labels.accountCode]: '',
      [labels.accountDesc]: '',
      [labels.balance]: balance,
      [labels.quantitative]: quantitativelySignificant ? labels.significant : labels.notSignificant,
      [labels.owner]: '',
      [labels.acceptance]: '',
      [labels.scope]: inScope ? labels.inScope : labels.outScope,
    });

    for (const leaf of leaves) {
      const owners = (leaf.assignedDepartmentIds ?? [])
        .map((id) => departmentName(id))
        .filter((name): name is string => Boolean(name))
        .join(', ');

      output.push({
        [labels.entityCode]: leaf.entityCode,
        [labels.fsli]: leaf.fsliName,
        [labels.accountCode]: leaf.noGL,
        [labels.accountDesc]: leaf.glDesc,
        [labels.balance]: leaf.balance,
        [labels.quantitative]: isAccountQuantitativelySignificant(leaf, pmValue)
          ? labels.significant
          : labels.notSignificant,
        [labels.owner]: owners || labels.unassigned,
        [labels.acceptance]: leaf.ownerAcceptance || labels.pending,
        [labels.scope]: isAccountInScope(leaf, pmValue) ? labels.inScope : labels.outScope,
      });
    }
  }

  return output;
}
