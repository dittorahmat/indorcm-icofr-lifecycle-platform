import type { Control } from '@shared/types';

/**
 * worksheet-row — one row shape for both worksheet renderers.
 *
 * The desktop table's columns and the mobile summary card each picked their own
 * fields out of `Control` and applied their own defaults (`|| '-'`). Both now
 * read this shape: the card through `toWorksheetRow`, the desktop through
 * react-table accessors over the same `Control` columns.
 *
 * The commit handle is the row's whole write surface — one seam instead of the
 * five mutation objects (create/update/delete diagram + control + debounce) the
 * column factory used to take.
 */

export interface WorksheetRow {
  id: string;
  /** `Control.code` — the worksheet's "No. BPM" identity column. */
  code: string;
  businessProcess: string;
  subProcess: string;
  name: string;
  location: string;
  description: string;
  isFraudRelated: boolean;
  reference: string;
  relatedControlIds: string[];
  supportingDocs: string;
  isKeyControl: boolean;
  ipos: string[];
  assertions: string[];
  type: Control['type'];
  nature: Control['nature'];
  applicationId: Control['applicationId'];
}

/** Exactly the columns a row reads — `Control` satisfies this structurally. */
export type WorksheetRowSource = Pick<
  Control,
  | 'id'
  | 'code'
  | 'businessProcess'
  | 'subProcess'
  | 'name'
  | 'location'
  | 'description'
  | 'isFraudRelated'
  | 'reference'
  | 'relatedControlIds'
  | 'supportingDocs'
  | 'isKeyControl'
  | 'ipos'
  | 'assertions'
  | 'type'
  | 'nature'
  | 'applicationId'
>;

/** The fields the debounced text commit accepts. */
export type WorksheetTextField =
  | 'bpmCode'
  | 'businessProcess'
  | 'subProcess'
  | 'name'
  | 'location'
  | 'description'
  | 'reference'
  | 'supportingDocs'
  | 'ipos'
  | 'assertions';

export interface WorksheetRowCommit {
  /** Debounced commit for text inputs (fires once the user stops typing). */
  saveField: (id: string, field: WorksheetTextField, value: string | string[]) => void;
  /** Immediate commit for selects, toggles and the ELC picker. */
  patch: (id: string, patch: Partial<Control>) => void;
  /** Deletes the row after the caller has confirmed. */
  remove: (id: string) => void;
  /** Opens the row's flow, creating the diagram first when none exists. */
  openDiagramFor: (subProcess: string) => void;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const list = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

export function toWorksheetRow(control: WorksheetRowSource): WorksheetRow {
  return {
    id: control.id,
    code: text(control.code),
    businessProcess: text(control.businessProcess),
    subProcess: text(control.subProcess),
    name: text(control.name),
    location: text(control.location),
    description: text(control.description),
    isFraudRelated: control.isFraudRelated === true,
    reference: text(control.reference),
    relatedControlIds: list(control.relatedControlIds),
    supportingDocs: text(control.supportingDocs),
    isKeyControl: control.isKeyControl === true,
    ipos: list(control.ipos),
    assertions: list(control.assertions),
    type: control.type,
    nature: control.nature,
    applicationId: control.applicationId,
  };
}

export function toWorksheetRows(controls: readonly WorksheetRowSource[]): WorksheetRow[] {
  return controls.map(toWorksheetRow);
}
