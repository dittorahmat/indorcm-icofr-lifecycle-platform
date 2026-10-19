# ADR 0008: Node Type Registry as the Sanctioned YAGNI Exception

## Status
Accepted (round 11, `arch/round11-bpm-node-registry`)

## Context
Round 11's scope was the BPM editor and worksheet. The first finding was that
**five modules each answered "what is this BPM node type?" separately**, and
they had drifted:

| Owner | What it held | Drift found |
| --- | --- | --- |
| `shared/bpm-node-types.ts` | the 40 literal type names | `output` absent from the union |
| `src/utils/bpm-constants.ts` | `DEFAULT_NODE_DIMENSIONS` | `output` present as a dimension |
| `src/components/rcm/editor/bpm-canvas-types.ts` | the renderer map | no renderer for `risk` / `control` |
| `src/components/rcm/editor/ocr/ocr-shape-badges.ts` | OCR badge label + tone | silent `DEFAULT_BADGE` fallback |
| `src/components/rcm/editor/BPMShapePalette.tsx` | 32 inline buttons | button labelled "Physical Form" created a `document` node; `output` button created a type that does not exist |

Three live defects fell out of that drift: the palette could create a node of a
type the canvas cannot render (`output`), persistable types `risk` / `control`
had **no** renderer at all (React Flow silently drew its default node), and
`useBPMNodeOperations` derived labels with `t('bpm:editor.nodes.' + type.replace('-',''))`
against camelCase bundle keys — so every hyphenated type asked for a key that
does not exist.

`docs/adr/0002-yagni-one-liner-enforcement.md` forbids new abstractions unless
they have (a) a second caller, (b) their own unit test, or (c) they split a
god-file. A node-type registry is a new module and a new indirection, so it
needed to justify itself explicitly.

## Decision
1. **`shared/bpm-node-registry.ts` is the one owner** of a node type's data
   half: `dimensions` and `labelKey` (`bpm:editor.nodes.*`), typed
   `Record<BpmNodeType, BpmNodeTypeEntry>`. `getStandardNodeDimensions` and
   `nodeLabelKeyOf` delegate to it; `DEFAULT_NODE_DIMENSIONS` is deleted.
2. **The React half stays in `src/`.** `worker/services/bpm/bpm-ocr.ts` imports
   `shared/bpm-node-types`, and `shared/` must not pull React into the worker, so
   the renderer map lives in `bpm-canvas-types.ts` and is locked to the union
   with `satisfies Record<BpmNodeType, unknown>`. Keys that are not union members
   (`risk-control-badge`) live in `LEGACY_NODE_RENDERERS`.
3. **Two label schemes are kept, deliberately.** The editor label names the node
   (`bpm:editor.nodes.*`); the OCR badge names the drawn shape
   (`bpm:ocr.shapes.*`) so a reviewer can check the classification against the
   picture. They are two presentations of one concept, both keyed by node type
   and both now validated against the registry — not two truths.
4. **YAGNI exception claimed on (b) and (c):** the registry is a pure data module
   with its own test (`shared/bpm-node-registry.test.ts`) that asserts full
   `BPM_NODE_TYPES` coverage and that every registry label key resolves in **both**
   the `en` and `id` bundles — the compensating control for
   `t(nodeLabelKeyOf(type))`, a *dynamic* key the `check:i18n` gate cannot see.
   It also pays for itself by deleting a table, not adding one.
5. **`output` is removed**, not aliased: it is not a Lampiran 3 symbol, the
   palette button is deleted, and the tooltip that claimed "Physical Form" now
   points at the shape it actually creates (`document`).

## Consequences
- A type added to `BPMNodeType` without a dimension, label, or renderer now fails
  to compile instead of rendering as React Flow's default node.
- Rejected alternatives, recorded so they are not re-litigated:
  - **a shared registry for OCR badge copy** — changes reviewer-facing copy for no
    structural gain (decided against; see Decision 3);
  - **trimming non-Lampiran-3 shapes from the palette** — out of scope for a
    consistency round; recorded as a finding, not a fix;
  - **data migration for legacy handle ids** — rejected in round 11's C2: the alias
    table is read-only, canonical ids are written by new code (`bpm-auto-layout`).
- Cross-references: `GLOSSARY.md` (`Node Type Registry`, `Renderer Parity`,
  `Canonical Handle Id`, `Legacy Handle Alias`), `AGENTS.md` §9–10,
  `docs/adr/0002-yagni-one-liner-enforcement.md`.
