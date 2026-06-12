## Context

In the transaction level control matrix (RCM TLC), compliance mappings (both Information Processing Objectives - IPO and Financial Statement Assertions - ASERSi) are stored as text values of `'Y'` or `'N'` in the database. The frontend table component currently evaluates these values as general truthy/falsy booleans, causing `'N'` to be rendered as checked (`✓`).

## Decisions

### 1. Explicit Check for `'Y'` String Value
- **Rationale**: Since the database columns `ipoC`, `ipoA`, etc., and `assertionE`, `assertionC`, etc., store `'Y'` or `'N'`, checking `row.assertionE === 'Y'` resolves the rendering bug and accurately reflects the underlying database status.

### 2. Standardize Visual Indicators to 'Y' / 'N'
- **Rationale**: The user requested changing the checkmark (`✓`) and dash (`—`) representation to **`Y`** (Yes) and **`N`** (No). This simplifies the spreadsheet layout, aligns it with standard corporate audit templates, and enhances readability.
- **Implementation**:
  - For IPO columns:
    ```typescript
    render: (row) => row.ipoC === 'Y' ? 'Y' : 'N'
    ```
  - For Assertion columns:
    ```typescript
    render: (row) => row.assertionE === 'Y' ? 'Y' : 'N'
    ```

## Risks / Trade-offs

- **[Risk]**: Localization impact if the user wants "Ya" and "Tidak" in Indonesian mode.
- **[Mitigation]**: `Y` and `N` are standard regulatory abbreviations in ICOFR matrices (even in Indonesia) representing "Yes" / "No" or "Ya" / "Tidak". Keeping them as single uppercase letters (`Y` / `N`) is clean and standard across both languages.
