## Why

The user provided an Excel template ("Template Report.xlsx") containing 7 mandatory regulatory reporting sheets. To ensure the application is production-ready and compliant with BUMN standards, we need to implement these specific report views with realistic mockup data for PT BATUBARA NUSANTARA SEJAHTERA.

## What Changes

- **New Reports Implementation**: Add a new sub-menu or section in the "Reports" page to display the 7 standardized reports:
    1. RCM ELC (Entity Level Control)
    2. RCM TLC (Transaction Level Control)
    3. RCM ITGC (IT General Control)
    4. Format Daftar Temuan (Findings List)
    5. Penentuan DOD (Degree of Deficiency)
    6. Report Log Perubahan Bisnis (Change Management Log)
    7. Report Dokumentasi CSA (CSA Documentation)
- **Fictional Data Branding**: Populate these reports with mockup data for "PT BATUBARA NUSANTARA SEJAHTERA".
- **Visual Mapping**: Replicate the exact column headers and structure from the Excel template into Shadcn/UI Table components.

## Capabilities

### New Capabilities
- `standardized-bumn-reports`: Comprehensive set of 7 regulatory reports as per SK-5/2024.

### Modified Capabilities
- None

## Impact

- `src/pages/reports/ReportsPage.tsx`: This file will be significantly expanded or modularized to include these new report views.
- Data Integration: Mock data will be hardcoded or seeded to demonstrate the "PT BATUBARA NUSANTARA SEJAHTERA" scenario.
