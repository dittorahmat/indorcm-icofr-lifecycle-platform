## Context

State-Owned Enterprises (BUMN) compliance requirements mandate adherence to Regulation SK-5/DKU.MBU/11/2024. As outlined in `proposal.md`, audit reviews and sign-offs are conducted on both desktop workstations and mobile touch devices. The UI relies on Tailwind CSS, Radix UI dialogs, and custom Shadcn-style components. All modifications must comply with the strict `design-taste-frontend` rules: no fonts below 12px, institutional border radii (`rounded-md` / `rounded-lg`), solid surfaces without faux glassmorphism, and complete localization (i18n).

## Goals / Non-Goals

**Goals:**
- Provide responsive view switching in `TodoListPage`: Monthly Grid on desktop (>= md) and clean vertical Agenda Feed on mobile (< md).
- Implement touch-friendly mobile bottom sheets (Drawer / Sheet) for `WorkflowPanel` approval flows with a sticky bottom action bar and preset note chips.
- Add an unread pending approval badge counter to `MobileBottomNav` for real-time compliance alerting.
- Embed an executive summary card above CSA records on mobile viewports.

**Non-Goals:**
- Altering backend PostgreSQL schemas or Hono API contracts (existing endpoints already supply necessary payload fields).
- Re-architecting desktop BPM visual graph editors (React Flow canvas remains intact for desktop).

## Decisions

### 1. Viewport Adaptation via Tailwind Breakpoints & MatchMedia
- **Decision**: Use a combination of responsive CSS classes (`hidden md:block` / `block md:hidden`) and a custom `useIsMobile()` hook.
- **Rationale**: CSS visibility prevents hydration layout shift for basic markup, while JS hook conditionally switches complex render trees to minimize DOM nodes on mobile.
- **Alternatives considered**: Separate mobile routes (e.g. `/m/todo`) — rejected because it breaks unified URL sharing and tab synchronizations.

### 2. Sheet / Drawer vs Dialog Modal for Approvals
- **Decision**: In `WorkflowPanel`, conditionally render `<Sheet side="bottom">` or bottom drawer for mobile viewports, retaining standard `<Dialog>` for desktop.
- **Rationale**: Bottom sheets are ergonomically accessible with single-thumb interaction and accommodate mobile keyboards better than centered desktop modals.

### 3. Quick Note Preset Chips
- **Decision**: Render institutional quick note chips (e.g., "Disetujui sesuai lampiran", "Mohon lengkapi bukti sampel") above the review textarea.
- **Rationale**: Mobile typing is slow and prone to typos; standardized preset chips streamline common BUMN review verdicts while preserving editability.

## Risks / Trade-offs

- **[Risk] Visual discrepancy between desktop and mobile approval states**  
  → *Mitigation*: Both components will invoke the exact same `useWorkflow` hook mutations (`submitMutation`, `reviewMutation`, `approveMutation`) to guarantee data parity.
- **[Risk] Safe-area clipping on mobile devices with bottom bars (iOS home indicator)**  
  → *Mitigation*: Ensure sticky mobile action bars utilize `pb-[env(safe-area-inset-bottom)]` and standard Tailwind spacing.
