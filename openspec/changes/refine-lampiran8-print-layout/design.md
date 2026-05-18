## Context

The previous implementation of the PDF print feature for Lampiran 8 successfully added the button and basic landscape CSS. However, the table is so wide that even with `zoom: 0.65`, columns on the far right (like Kesimpulan) are getting cut off. Furthermore, the main application header (with user profile, etc.) is still visible, making it look like a web page rather than a formal document.

## Goals / Non-Goals

**Goals:**
- Fix the CSS print rules to ensure all columns of the `VerificationDesignPage` matrix fit onto a printed page.
- Hide the `MainHeader` component during printing.
- Ensure text wrapping is allowed in table cells during printing to conserve horizontal space.

**Non-Goals:**
- Removing columns required by the regulation to save space.

## Decisions

### 1. Advanced Print CSS for Extreme Widths
We will update `src/index.css` to use a more aggressive `zoom` factor specifically for tables, or switch to CSS `transform: scale()` if `zoom` is inconsistent across browsers. We will also force `white-space: normal` and `word-break: break-word` on table cells during print to allow text to wrap tightly, reducing the required horizontal width.

### 2. Hiding the Main Header
We will locate the `MainHeader` component (likely inside `AppLayout.tsx` or similar) and add the `print:hidden` Tailwind class to its root element.

## Risks / Trade-offs

- **Risk:** Extreme scaling might make the text very small and hard to read.
  - *Mitigation:* This is an unavoidable trade-off when trying to fit 30+ columns onto an A4 page without a dedicated PDF generation library that handles complex multi-page spanning. We will rely on text wrapping to keep the scale as legible as possible.
