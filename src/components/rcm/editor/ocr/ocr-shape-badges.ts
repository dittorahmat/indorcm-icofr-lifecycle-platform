export interface OcrShapeBadge {
  labelKey: string;
  iconBg: string;
}

const DEFAULT_BADGE: OcrShapeBadge = {
  labelKey: 'bpm:ocr.shapes.activity',
  iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-md',
};

export const OCR_SHAPE_BADGES: Record<string, OcrShapeBadge> = {
  start: { labelKey: 'bpm:ocr.shapes.start', iconBg: 'bg-emerald-50 border-emerald-300 text-emerald-700 rounded-full' },
  end: { labelKey: 'bpm:ocr.shapes.end', iconBg: 'bg-rose-50 border-rose-300 text-rose-700 rounded-full' },
  'automated-activity': { labelKey: 'bpm:ocr.shapes.system', iconBg: 'bg-blue-50 border-blue-300 text-blue-700 rounded-md' },
  decision: { labelKey: 'bpm:ocr.shapes.decision', iconBg: 'bg-amber-50 border-amber-300 text-amber-700 rotate-45 transform w-7 h-7' },
  archive: {
    labelKey: 'bpm:ocr.shapes.archive',
    iconBg: 'bg-slate-50 border-slate-800 text-slate-700 [clip-path:polygon(0%_0%,100%_0%,50%_100%)] w-8 h-8',
  },
  'data-media': { labelKey: 'bpm:ocr.shapes.dataMedia', iconBg: 'bg-sky-50 border-sky-300 text-sky-700 rounded-t-lg rounded-b-lg' },
  document: { labelKey: 'bpm:ocr.shapes.document', iconBg: 'bg-slate-50 border-slate-400 text-slate-600 rounded-b-xl' },
  'alternate-process': { labelKey: 'bpm:ocr.shapes.alternateProcess', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-lg' },
  data: { labelKey: 'bpm:ocr.shapes.data', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-sm' },
  'predefined-process': {
    labelKey: 'bpm:ocr.shapes.predefinedProcess',
    iconBg: 'bg-slate-50 border-slate-300 text-slate-700 border-l-4 border-r-4',
  },
  'internal-storage': { labelKey: 'bpm:ocr.shapes.internalStorage', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  'multi-document': { labelKey: 'bpm:ocr.shapes.multiDocument', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 shadow-sm' },
  preparation: { labelKey: 'bpm:ocr.shapes.preparation', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-[50%]' },
  'manual-operation': { labelKey: 'bpm:ocr.shapes.manualOperation', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  card: { labelKey: 'bpm:ocr.shapes.card', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-tl-none' },
  'punched-tape': { labelKey: 'bpm:ocr.shapes.punchedTape', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  'summing-junction': { labelKey: 'bpm:ocr.shapes.summingJunction', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-full' },
  or: { labelKey: 'bpm:ocr.shapes.or', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-full' },
  collate: { labelKey: 'bpm:ocr.shapes.collate', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  sort: { labelKey: 'bpm:ocr.shapes.sort', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  extract: { labelKey: 'bpm:ocr.shapes.extract', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  merge: { labelKey: 'bpm:ocr.shapes.merge', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  'stored-data': { labelKey: 'bpm:ocr.shapes.storedData', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-r-full' },
  delay: { labelKey: 'bpm:ocr.shapes.delay', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-r-full' },
  'sequential-access': {
    labelKey: 'bpm:ocr.shapes.sequentialAccess',
    iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-full',
  },
  'direct-access': { labelKey: 'bpm:ocr.shapes.directAccess', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-r-full' },
  display: { labelKey: 'bpm:ocr.shapes.display', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 rounded-l-full' },
  'loop-limit': { labelKey: 'bpm:ocr.shapes.loopLimit', iconBg: 'bg-slate-50 border-slate-300 text-slate-700' },
  annotation: { labelKey: 'bpm:ocr.shapes.annotation', iconBg: 'bg-slate-50 border-slate-300 text-slate-700 border-dashed' },
  swimlane: { labelKey: 'bpm:editor.nodes.swimlane', iconBg: 'bg-indigo-50 border-indigo-300 text-indigo-700 rounded-md' },
};

export const OCR_NODE_TYPE_OPTIONS: string[] = [
  'start',
  'end',
  'activity',
  'automated-activity',
  'decision',
  'archive',
  'data-media',
  'document',
  'swimlane',
  'alternate-process',
  'data',
  'predefined-process',
  'internal-storage',
  'multi-document',
  'preparation',
  'manual-operation',
  'card',
  'punched-tape',
  'summing-junction',
  'or',
  'collate',
  'sort',
  'extract',
  'merge',
  'stored-data',
  'delay',
  'sequential-access',
  'direct-access',
  'display',
  'loop-limit',
  'annotation',
];

export function getOcrShapeBadge(nodeType: string | undefined): OcrShapeBadge {
  if (!nodeType) return DEFAULT_BADGE;
  return OCR_SHAPE_BADGES[nodeType] ?? DEFAULT_BADGE;
}

const OPTION_KEY_OVERRIDES: Record<string, string> = {
  start: 'bpm:ocr.options.start',
  end: 'bpm:ocr.options.end',
  activity: 'bpm:ocr.options.activity',
  'automated-activity': 'bpm:ocr.options.system',
  decision: 'bpm:ocr.options.decision',
  archive: 'bpm:ocr.options.archive',
  'data-media': 'bpm:ocr.options.dataMedia',
  document: 'bpm:ocr.options.document',
  swimlane: 'bpm:editor.nodes.swimlane',
};

export function getOcrOptionLabelKey(nodeType: string): string {
  return OPTION_KEY_OVERRIDES[nodeType] ?? `bpm:ocr.options.${nodeType}`;
}
