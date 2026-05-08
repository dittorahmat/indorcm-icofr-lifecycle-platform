## Context

The application recently underwent a UI overhaul that standardized on a Skyblue (#87CEEB) theme with a dynamic sidebar. However, user feedback indicates a preference for the previous "Tuft Blue" and "Deep Blue" branding, as well as the ability to keep the sidebar permanently expanded (pinned). Currently, the sidebar is locked to an expanded state in `AppLayout.tsx` via hardcoded props, which prevents users from collapsing it.

## Goals / Non-Goals

**Goals:**
- Revert visual styles of Header and Sidebar to the "Classic Blue" theme.
- Implement a user-toggleable "Pin" state for the sidebar.
- Persist the pinning preference across sessions.
- Ensure the sidebar behaves as a static element when pinned and a dynamic element when unpinned.

**Non-Goals:**
- Implementing advanced sidebar layouts (e.g., dual sidebars).
- Changing the internal navigation content/routes of the sidebar.

## Decisions

### 1. Unified Sidebar State Management
We will extend the `SidebarContext` in `src/components/ui/sidebar.tsx` to include an `isPinned` state.

- **Rationale**: The `SidebarProvider` already manages `open` and `isMobile` states. Adding `isPinned` here allows all sidebar sub-components to access the pinning state without creating a new context.
- **Persistence**: A new cookie `sidebar_pinned` will be used to store the state, similar to how the `open` state is currently stored.

### 2. Dynamic `collapsible` Prop
The `Sidebar` component will derive its `collapsible` behavior from the `isPinned` state.

- **Pinned**: `collapsible="none"`. This ensures the sidebar is always visible and occupies layout space (pushing the main content).
- **Unpinned**: `collapsible="icon"`. This allows the sidebar to be collapsed to a mini-rail, maximizing workspace while keeping navigation accessible via icons.

### 3. Header and Sidebar Style Revert
Styles will be moved back from hardcoded Tailwind colors in the components to either CSS variables or the previous color palette.

- **MainHeader**: Revert to `bg-[#417dc1]` (Tuft Blue) and `text-white`.
- **AppSidebar**: Revert background to the default `bg-sidebar` (which maps to the deep blue CSS variable in `index.css`). Restore the `SidebarHeader` containing the "IndoGRC Pro" logo and branding.

### 4. Layout Integration
Modify `src/components/layout/AppLayout.tsx` to stop overriding the sidebar state.

- **Action**: Remove `open={true}` and `onOpenChange={() => {}}` from `SidebarProvider`. This allows the provider's internal state (driven by cookies and user interaction) to take control.

## Risks / Trade-offs

- **[Risk] State Conflict** → If `isPinned` is true but `open` is false (due to an old cookie), the sidebar might appear collapsed but static. 
- **Mitigation**: The `toggleSidebar` logic will be updated to ensure that if the sidebar is Pinned, it is also forced to an Expanded state.
- **[Trade-off] Component Complexity** → Adding pinning logic to the base UI component `sidebar.tsx` increases its complexity. 
- **Mitigation**: The logic is straightforward and fits well within the existing `SidebarProvider` pattern.
