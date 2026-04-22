## Database Schema Update
Column `risk_library_id` (text) will be added to `rcms` table, nullable (since manual risks might still exist from legacy data).

## Localization Schema
A new namespace `risklibrary` will be used to store all strings related to management and lookup.

### Key strings to move:
- `title`: "Risk Library" / "Perpustakaan Risiko"
- `add_button`: "Add Standardized Risk" / "Tambah Risiko Standar"
- `search_placeholder`: "Search risk..." / "Cari risiko..."
- `lookup_btn`: "Lookup Library" / "Lihat Library"

## Task Flow
1. Schema Update -> 2. Migration -> 3. Backend Logic -> 4. i18n JSONs -> 5. UI Refactor.
