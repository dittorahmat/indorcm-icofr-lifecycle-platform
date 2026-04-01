## Why

Saat ini aplikasi memiliki 2 komponen upload GL (General Ledger) yang terpisah dengan kemampuan berbeda-beda, namun keduanya tidak dapat membaca format file GL yang umum digunakan di BUMN (delimiter semicolon, kolom No_GL/GL_Desc/GL_Balance). User tidak bisa upload file GL.csv mereka karena column mapping tidak match. Perlu enhancement untuk support berbagai format GL dengan auto-detection dan mapping yang flexible.

## What Changes

- **Enhanced GL Column Mapping**: Support multiple column name variations (No_GL → accountCode, GL_Desc → accountName, GL_Balance → balance)
- **Balance Parser**: Handle Indonesian number format (spaces, period as thousand separator, parentheses for negative)
- **Semicolon Delimiter Support**: Auto-detect delimiter (comma vs semicolon)
- **FSLI Code Support**: Map Kode_FSLI to Financial Statement Line Item codes for regulatory reporting
- **Entity Code Support**: Map Kode_Entity for multi-entity scoping
- **Empty Row Filtering**: Auto-filter empty/blank rows
- **Consolidated GL Upload**: Merge GLDataIntake and GLUploadDialog into unified component
- **Download Template**: Provide sample GL template in correct format

## Capabilities

### New Capabilities

- `gl-column-mapping`: Auto-detect and map various GL column naming conventions
- `balance-parser`: Parse Indonesian number format with validation
- `gl-data-validation`: Validate GL data integrity (balance check, duplicate detection)
- `gl-template-download`: Download sample GL template in CSV/XLSX format

### Modified Capabilities

- `gl-upload`: Enhance existing GL upload to support multiple formats and auto-mapping

## Impact

- **Frontend Components**: GLDataIntake.tsx, GLUploadDialog.tsx (consolidate)
- **Scoping Page**: Update GL upload integration
- **Compliance Utils**: Add balance parser and validation functions
- **User Experience**: Support real GL formats from BUMN
- **Data Quality**: Better validation and error messages
