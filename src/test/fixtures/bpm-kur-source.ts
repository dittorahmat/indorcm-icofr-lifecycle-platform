// Reconstruction of the KUR drawing shown in `BPM_Persetujuaan_Kredit_KUR`
// (content, lanes, labels and edges taken from the rendered diagram; the 0-1000
// top-left coordinates are an explicit reconstruction because the raw
// `POST /api/bpm-diagrams/ocr` payload was never captured).
//
// Lane order in the drawing is KOMITE KREDIT -> MARKETING -> CALON DEBITUR ->
// LEGAL, and two forward handoffs legitimately point *upwards* (the receiving
// lane's content sits higher on the page). Those two edges are named here so a
// test can assert the upward set exactly, instead of assuming "down only".
import type { OcrRawEdge, OcrRawNode } from '../../utils/ocr-validate';

export const KUR_LANE_ORDER = ['lane-komite', 'lane-marketing', 'lane-calon', 'lane-legal'] as const;

export const KUR_UPWARD_EDGE_IDS = ['e-komite-offering', 'e-calon-legal'] as const;

/** Every label that must survive extraction, in drawing order. */
export const KUR_LABELS_IN_ORDER = [
  'MULAI',
  'MENERIMA USULAN KREDIT',
  'USULAN KREDIT (TELAH DIPERIKSA)',
  'KOMITE MEMERIKSA USULAN KREDIT',
  'MEMBUAT PERTIMBANGAN DAN PERSETUJUAN',
  'KEPUTUSAN',
  'Membuat offering letter',
  'Memberitahu nasabah',
  'MENERIMA OFFERING LETTER',
  'KEPUTUSAN',
  'MENERIMA OFFERING LETTER',
  'ARSIP',
  'KE PROSEDUR AKAD KREDIT',
  'SELESAI',
] as const;

function lane(id: string, label: string, x: number): OcrRawNode {
  return {
    id,
    type: 'swimlane',
    label,
    department: label,
    function: 'Func',
    position: { x, y: 20 },
    width: 240,
    height: 960,
  };
}

function shape(
  id: string,
  type: string,
  label: string,
  x: number,
  y: number,
  parentId: string,
): OcrRawNode {
  return { id, type, label, position: { x, y }, parentId };
}

export function buildKurSourceFixture(): { nodes: OcrRawNode[]; edges: OcrRawEdge[] } {
  const lanes = [
    lane('lane-komite', 'KOMITE KREDIT', 10),
    lane('lane-marketing', 'MARKETING', 270),
    lane('lane-calon', 'CALON DEBITUR', 530),
    lane('lane-legal', 'LEGAL', 790),
  ];

  const nodes = [
    // KOMITE KREDIT
    shape('k-start', 'start', 'MULAI', 114, 36, 'lane-komite'),
    shape('k-recv', 'document', 'MENERIMA USULAN KREDIT', 88, 116, 'lane-komite'),
    shape('k-checked', 'document', 'USULAN KREDIT (TELAH DIPERIKSA)', 88, 198, 'lane-komite'),
    shape('k-review', 'activity', 'KOMITE MEMERIKSA USULAN KREDIT', 88, 287, 'lane-komite'),
    shape('k-deliberate', 'activity', 'MEMBUAT PERTIMBANGAN DAN PERSETUJUAN', 88, 386, 'lane-komite'),
    shape('k-decision', 'decision', 'KEPUTUSAN', 116, 518, 'lane-komite'),

    // MARKETING
    shape('m-offering', 'activity', 'Membuat offering letter', 372, 111, 'lane-marketing'),
    shape('m-notify', 'activity', 'Memberitahu nasabah', 420, 725, 'lane-marketing'),

    // CALON DEBITUR
    shape('c-offering', 'document', 'MENERIMA OFFERING LETTER', 575, 282, 'lane-calon'),
    shape('c-decision', 'decision', 'KEPUTUSAN', 603, 435, 'lane-calon'),

    // LEGAL
    shape('l-offering', 'document', 'MENERIMA OFFERING LETTER', 843, 102, 'lane-legal'),
    shape('l-archive', 'archive', 'ARSIP', 895, 275, 'lane-legal'),
    shape('l-akad', 'activity', 'KE PROSEDUR AKAD KREDIT', 860, 571, 'lane-legal'),
    shape('l-end', 'end', 'SELESAI', 869, 661, 'lane-legal'),
  ];

  const edges: OcrRawEdge[] = [
    { id: 'e-start-recv', source: 'k-start', target: 'k-recv' },
    { id: 'e-recv-checked', source: 'k-recv', target: 'k-checked' },
    { id: 'e-checked-review', source: 'k-checked', target: 'k-review' },
    { id: 'e-review-deliberate', source: 'k-review', target: 'k-deliberate' },
    { id: 'e-deliberate-decision', source: 'k-deliberate', target: 'k-decision' },
    // Forward handoff that climbs one lane up (YES branch).
    { id: 'e-komite-offering', source: 'k-decision', target: 'm-offering', label: 'YES' },
    { id: 'e-komite-notify', source: 'k-decision', target: 'm-notify', label: 'NO' },
    { id: 'e-offering-calon', source: 'm-offering', target: 'c-offering' },
    { id: 'e-calon-decision', source: 'c-offering', target: 'c-decision' },
    // Second legitimate upward handoff (CALON -> LEGAL).
    { id: 'e-calon-legal', source: 'c-decision', target: 'l-offering', label: 'YES' },
    { id: 'e-calon-notify', source: 'c-decision', target: 'm-notify', label: 'NO' },
    { id: 'e-legal-archive', source: 'l-offering', target: 'l-archive' },
    { id: 'e-archive-akad', source: 'l-archive', target: 'l-akad' },
    { id: 'e-akad-end', source: 'l-akad', target: 'l-end' },
  ];

  // Lane order comes from coordinates, not input order: shuffle on purpose.
  return { nodes: [lanes[2], lanes[0], lanes[3], lanes[1], ...nodes], edges };
}
