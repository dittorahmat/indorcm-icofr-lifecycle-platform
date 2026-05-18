## Why

The current PDF export for the Lampiran 8 verification matrix truncates columns because the table is extremely wide. Furthermore, the print output includes the main application header, which distracts from the formal document format required by SK-5/DKU.MBU/11/2024. We need to refine the print CSS to ensure all columns fit on a landscape page and hide unnecessary UI elements like the main app header.

## What Changes

- Modify global print CSS to force aggressive scaling or text-wrapping for extremely wide tables.
- Add `print:hidden` to the main application header component.
- Ensure the table layout mimics a formal document output.

## Capabilities

### Modified Capabilities
- `lampiran-8-pdf-export`: Refining the print layout to ensure no data truncation and a cleaner, document-like appearance.

## Impact

- **Frontend Components:** Global CSS (`index.css` or `App.css`), `AppLayout` or `MainHeader` component.
- **API:** No API changes.
- **Database:** No database changes.
