# Sovereign Design System & Banners

Standard token and layout guidelines for IndoGRC Pro Sovereign BUMN compliance interface.

## Sovereign Header Banners

All main compliance modules must use the shared Light Sovereign banner layout constants from `src/components/ui/sovereign-banner.ts`:

- `SOVEREIGN_CARD_CONTAINER`:
  `relative overflow-hidden bg-white dark:bg-card text-foreground rounded-xl p-4 sm:p-6 shadow-xs border border-border/80 border-l-4 border-l-secondary`
- `SOVEREIGN_METRIC_CARD`:
  `flex flex-wrap sm:flex-nowrap items-stretch gap-4 bg-slate-50 dark:bg-slate-900/40 p-3.5 sm:p-4 rounded-xl border border-border/60 shrink-0`

### Mandates:
1. **Light Sovereign Card Standard**: Compliance workspaces must use crisp light backgrounds (`bg-white dark:bg-card`) with a BUMN teal left accent (`border-l-4 border-l-secondary`).
2. **Zero Low-Contrast Anti-Patterns**: Dark container backgrounds (`bg-primary-container` / `#0f2942`) and transparent white text (`text-white/70`, `bg-white/10`) are strictly forbidden on light surfaces. Enforced automatically by `npm run check:contrast`.
3. **Contrast Compliance**: Labels and metrics must comply with WCAG AA standard (use `text-slate-600 dark:text-slate-300 font-bold` or `text-foreground`).
