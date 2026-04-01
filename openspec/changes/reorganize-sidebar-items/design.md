## Context

The current `AppSidebar` structure follows a lifecycle-based grouping. The user wants a more traditional enterprise functional grouping.

## Goals / Non-Goals

**Goals:**
- Implement the exact grouping and naming from `sidebar-sample.jpeg`.
- Maintain existing route functionality while re-labeling.
- Add placeholders for future AI features.

**Non-Goals:**
- Creating new functionality for the AI placeholders (they will just be visual placeholders or links to the chatbot for now).
- Deep structural changes to the page content (just the sidebar link structure).

## Decisions

- **MASTER Group**:
    - "Sync Financial Statement" -> Maps to `/import`.
    - "Select BPM" -> Maps to `/csa` (specifically the Risk Control tab, but we'll link to `/csa` root for now).
    - "Config OM/PM" -> Maps to `/scoping`.
- **RCSA Group**:
    - "Identifikasi Risiko" -> Maps to `/csa` (Risk Control tab).
    - "Control" -> Maps to `/csa` (Risk Control tab).
    - "Self Assessment" -> Maps to `/csa` (Pending Action tab).
- **TOD/TOE Group**:
    - "Test Operasi Design" -> Maps to `/testing` (TOD filter).
    - "Test Operasi Efektivitas" -> Maps to `/testing` (TOE filter).
- **Report Group**:
    - List links for Lampiran 1 to 11. Since we have a consolidated reports page, we will link them all to `/reports` for now, or use URL hashes if we implement anchor links later.
- **AI Group**:
    - List items as static `SidebarMenuItem` buttons with `cursor-not-allowed` or just simple text for simulation.
- **User Group**:
    - "User Admin" -> Maps to `/settings`.

## Risks / Trade-offs

- [Duplicate Links] -> Several items map to the same pages (e.g., Identifikasi Risiko and Control both go to the consolidated matrix). *Mitigation*: This is acceptable as it matches the user's mental model of separate activities.
- [Placeholder AI] -> Users might expect functionality. *Mitigation*: Use tooltips or clear "Coming Soon" labels if needed.
