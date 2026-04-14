## Why

The application currently has inconsistent language usage across its UI, with a mix of Indonesian and English text for labels, headings, titles, buttons, form fields, navigation items, error messages, and other user-facing content. This creates a confusing user experience and makes the application feel unpolished. Standardizing all user-facing text to English will provide a consistent, professional experience across the entire platform.

## What Changes

- All Indonesian UI labels, headings, and titles will be translated to English
- Button text will be standardized to English
- Form labels, placeholders, and validation messages will be in English
- Navigation menu items and sidebar labels will be in English
- Table headers, column names, and data labels will be in English
- Error, success, and informational messages will be in English
- Modal/dialog titles and content will be in English
- Tooltip text and helper text will be in English
- Report titles, section headers, and export labels will be in English
- Configuration and settings page labels will be in English
- Database column comments and documentation strings will be updated to English

## Capabilities

### New Capabilities
- `ui-language-standardization`: Establishes English as the sole UI language with consistent labeling, terminology, and messaging conventions across all user-facing surfaces

### Modified Capabilities
<!-- No existing specs to modify - this is a new capability -->

## Impact

- **Frontend components**: All React/TSX component files containing Indonesian text (labels, headings, buttons, forms, tables, modals, navigation)
- **Configuration files**: Any config or constant files with Indonesian display values
- **Database layer**: Drizzle schema files with Indonesian column comments or descriptions
- **Documentation**: Markdown and text files with Indonesian headings or section titles
- **Translation infrastructure**: May need to establish an i18n structure if not already present
- **Approximately 26 files** across the codebase will require changes, covering 900+ instances of Indonesian text
