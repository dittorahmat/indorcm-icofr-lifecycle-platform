# ADR 0006: No Shared Wizard Shell Module (RCM vs Scoping Wizards)

## Status
Accepted

## Context
Architecture review (spec #25, ticket #31) proposed extracting shared wizard
shell primitives between the RCM import wizard (`RCMImportWizardModal` +
`useRCMImportWizard`, ADR-0001) and the scoping Trial Balance wizard
(`SmartImportWizard` + `WizardShell`). Tracer investigation showed:

1. Step logic in both wizards is one-liner state transitions (`setStep`),
   which ADR-0002 explicitly prefers to keep inline (glue UI).
2. Shell visuals differ by design: RCM uses a compact dialog with a
   flavor-conditional text step indicator; scoping uses a branded header,
   numbered-circle steps, and a sheet-selection modal. Converging them
   would regress UX without behavioral gain.
3. Footers live at different seams (RCM modal footer vs per-step scoping
   footers) with different styling systems. A shared visual footer would
   force design convergence beyond the ticket's scope.

## Decision
No shared wizard shell module. Domain flows stay deliberately separate per
ADR-0001; step logic stays inline per ADR-0002. Future architecture reviews
must not re-suggest a shared shell without new shared behavior (e.g. a
second consumer of step-guard decisions backed by tests).

## Consequences
- Ticket #31 closes as explored-without-extraction with this ADR as the
  revisit guard.
- Each wizard keeps its own shell; cross-wizard consistency is limited to
  the existing responsive-footer conventions (`w-full sm:w-auto`,
  `min-h-[44px]` touch targets).
- Rujukan silang: `docs/adr/0001-rcm-ingestion-and-bpm-linkage.md`,
  `docs/adr/0002-yagni-one-liner-enforcement.md`, `GLOSSARY.md`
  (`YAGNI-Violation`, `One-Liner`, `Abstraksi Sekali-Pakai`).
