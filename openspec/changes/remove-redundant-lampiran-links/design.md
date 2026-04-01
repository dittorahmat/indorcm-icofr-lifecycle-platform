## Context

The current sidebar implementation in `src/components/app-sidebar.tsx` uses an Array.map loop to generate 11 Lampiran links (Lampiran 1-11). All links point to the same `/reports` route, displaying identical content. This was likely a placeholder or temporary implementation that needs cleanup.

**Current Implementation:**
```tsx
{Array.from({ length: 11 }).map((_, i) => (
  <SidebarMenuItem key={i}>
    <SidebarMenuButton asChild isActive={isActive("/reports")}>
      <Link to="/reports"><FileText className="h-3 w-3 opacity-50" /> <span>Lampiran {i + 1}</span></Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
))}
```

**Stakeholders:**
- End users (Finance, Audit teams) - benefit from cleaner navigation
- Developers - easier to maintain without redundant code

## Goals / Non-Goals

**Goals:**
- Remove redundant Lampiran 1-10 links from sidebar
- Keep only Lampiran 11 as the single report link
- Maintain existing routing and report functionality
- Clean, maintainable code

**Non-Goals:**
- No changes to the `/reports` page content or functionality
- No changes to other sidebar navigation items
- No new report features or capabilities

## Decisions

### 1. Single Static Link vs Dynamic List

**Decision:** Replace the Array.map loop with a single static Lampiran 11 link.

**Rationale:**
- Simpler code - no loop needed for single item
- More explicit - clear intent that only Lampiran 11 exists
- Easier to maintain - no array manipulation

**Alternatives Considered:**
- Keep array but with length 1: Still unnecessary complexity
- Use conditional rendering: Adds logic without benefit

## Risks / Trade-offs

**[User Confusion]** → Users accustomed to seeing Lampiran 1-11 might wonder where the others went.
- *Mitigation:* Since all links showed the same content anyway, no functionality is lost. Users will adapt quickly.

**[Future Requirements]** → If different Lampiran pages are needed later, they'll need to be implemented properly with unique routes.
- *Mitigation:* This change makes it clear that Lampiran 1-10 don't exist, setting proper expectations for future implementation.

## Migration Plan

**Deployment:**
1. Update `app-sidebar.tsx` to replace loop with single link
2. Test sidebar renders correctly
3. Verify Lampiran 11 link navigates to `/reports`
4. Confirm no other components reference the removed links

**Rollback Strategy:**
- Simple git revert of the `app-sidebar.tsx` change if issues arise

## Open Questions

None - this is a straightforward UI cleanup with no technical ambiguity.
