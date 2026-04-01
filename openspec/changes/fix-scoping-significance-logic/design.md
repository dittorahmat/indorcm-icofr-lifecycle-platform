## Context

The current `ScopingPage.tsx` has two main flaws:
1.  **Static UI**: The "Status" column in the accounts table always shows "Significant" via a hardcoded `<Badge>Significant</Badge>`.
2.  **Greedy Import**: Every account from a GL upload is added to the `localAccounts` state, regardless of significance.

## Goals / Non-Goals

**Goals:**
- Implement dynamic badges based on account significance data.
- Automate filtering of significant accounts during the GL upload process.
- Improve the readability of the "Reason" column by showing actual qualitative factors.

**Non-Goals:**
- Removing the ability to add accounts manually (Qualitative Wizard).
- Persistent database migration (focusing on the frontend logic/state first).

## Decisions

### 1. Dynamic Status Badge
Instead of a static badge, use a conditional render in the table:
```tsx
const isSignificant = acc.isQuantitative || (acc.qualitativeReasons && acc.qualitativeReasons.length > 0);
<TableCell>
  <Badge variant={isSignificant ? "default" : "secondary"}>
    {isSignificant ? "Significant" : "Insignificant"}
  </Badge>
</TableCell>
```

### 2. GL Import Filtering
Modify the `handleDataImported` function in `ScopingPage.tsx` to automatically filter the imported data:
```typescript
const significantNewAccounts = data
  .map(row => ({
    // ... mapping logic
    isQuantitative: row.balance >= pm,
  }))
  .filter(acc => acc.isQuantitative); // Only auto-add if above threshold
```

### 3. Reason Column Logic
Display "> PM" if `isQuantitative` is true. If not, join the `qualitativeReasons` array into a comma-separated string. If both are empty, show "None".

## Risks / Trade-offs

- **Risk**: Users might miss accounts that are *almost* at the PM threshold but need qualitative review.
  - **Mitigation**: Add a "Review All Accounts" toggle or a secondary table for "Insignificant" accounts to allow manual promotion.
- **Risk**: Breaking existing mock data.
  - **Mitigation**: Ensure the mock data in `mock-data.ts` has at least one qualitative reason for accounts below PM.
