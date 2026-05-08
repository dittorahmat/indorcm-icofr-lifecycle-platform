## Context

The application needs a unified and standardized UI to meet user requirements for clarity and brand alignment. The current hybrid layout (Header + Sidebar) and nested scrolling in grids/sidebars are identified as friction points.

## Goals / Non-Goals

**Goals:**
- Implement a unified notification center in the `MainHeader`.
- Lock the theme to "Blue (Classic)" (Light Mode).
- Standardize sidebar styling (Skyblue bg, Bold Black text) and make it static.
- Implement layout swaps for Scoping and CSA Assessment pages.
- Standardize grid visuals (Zebra striping, thick borders) and scrolling (global scroll).
- Implement RCM inline editing row behavior.

**Non-Goals:**
- Changing backend API logic or notification storage.
- Reorganizing sidebar menu items (keep current groups).
- Refactoring the entire CSS system (use targeted Tailwind/CSS updates).

## Decisions

### 1. Theme and Header Standardization
- **Decision**: Force `isDark` to `false` in `useTheme` hook and remove `ThemeToggle` from `MainHeader`.
- **Rationale**: User explicitly requested the Blue Classic theme as default and removal of the toggle.

### 2. Sidebar Aesthetics and Behavior
- **Decision**: Update `AppSidebar` to use `bg-[#87CEEB]` for background and `text-black font-bold` for items. Disable `collapsible` prop.
- **Rationale**: Direct user requirement from the PDF reference.
- **Scrolling**: Remove `overflow-y-auto` from sidebar content. The `SidebarInset` in `AppLayout` will be responsible for the global scroll.

### 3. Layout Swaps
- **Decision**: Reorder flex items in `ScopingPage` and `CSATabContent`.
- **Implementation**: Use `flex-row-reverse` or simply swap component positions in the TSX.

### 4. Grid Visuals and Zebra Striping
- **Decision**: Modify `src/components/ui/table.tsx` (or `index.css`) to add `even:bg-slate-100/50` (zebra) and `border-2` or specific border classes for thickness.
- **Scrolling**: Remove `max-h` or `ScrollArea` containers from tables. Ensure they render their full height so the main container scroll handles navigation.

### 5. RCM Inline Editing
- **Decision**: Add an `isEditing` state to the RCM table. When active, insert a new row `<tr>` directly after the edited row with input fields.
- **Rationale**: Mimics the requested "row below and freeze others" behavior.

## Risks / Trade-offs

- **[Risk]** → Long tables without sticky headers might be hard to read during long scrolls. **Mitigation**: Consider making table headers sticky within the global scroll context if possible, or ensure the page structure keeps headers visible.
- **[Risk]** → Static sidebar might take up too much screen real estate on smaller screens. **Mitigation**: Ensure the layout remains responsive while respecting the "static" requirement for desktop.
- **[Risk]** → "Freezing" rows during RCM edit might block other user actions. **Mitigation**: Implement a clear "Cancel" or "Save" button to release the freeze state.
