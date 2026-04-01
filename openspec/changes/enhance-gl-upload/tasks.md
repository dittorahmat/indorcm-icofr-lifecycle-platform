## 1. Balance Parser Implementation

- [ ] 1.1 Create parseBalance() function di compliance-utils.ts
- [ ] 1.2 Handle Indonesian format (period thousand separator, comma decimal)
- [ ] 1.3 Handle parentheses for negative values
- [ ] 1.4 Handle space-padded values
- [ ] 1.5 Add validation untuk invalid formats
- [ ] 1.6 Write unit tests untuk balance parser

## 2. Column Mapping Implementation

- [ ] 2.1 Create columnMapping constant dengan priority lists
- [ ] 2.2 Implement detectColumns() auto-detection function
- [ ] 2.3 Add support untuk No_GL, GL_Desc, GL_Balance
- [ ] 2.4 Add support untuk Kode_FSLI mapping
- [ ] 2.5 Add support untuk Kode_Entity mapping
- [ ] 2.6 Show detected mapping preview to user

## 3. GLDataIntake Enhancement

- [ ] 3.1 Add CSV support ke GLDataIntake (currently Excel only)
- [ ] 3.2 Integrate column auto-detection
- [ ] 3.3 Integrate balance parser
- [ ] 3.4 Add semicolon delimiter auto-detection
- [ ] 3.5 Add empty row filtering
- [ ] 3.6 Update preview table dengan new data structure
- [ ] 3.7 Add FSLI code display column

## 4. ScopingPage Integration

- [ ] 4.1 Remove GLUploadDialog component
- [ ] 4.2 Integrate enhanced GLDataIntake component
- [ ] 4.3 Update onUpload callback dengan new data format
- [ ] 4.4 Update PM threshold integration
- [ ] 4.5 Test end-to-end GL upload flow

## 5. Template Download Feature

- [ ] 5.1 Create GL template CSV (semicolon delimiter)
- [ ] 5.2 Create GL template CSV (comma delimiter)
- [ ] 5.3 Create GL template XLSX (optional)
- [ ] 5.4 Add download button di GL upload dialog
- [ ] 5.5 Add sample rows dengan Indonesian format examples

## 6. Testing & Validation

- [ ] 6.1 Test dengan Sample Data GL.csv
- [ ] 6.2 Test dengan format CSV existing (backward compatibility)
- [ ] 6.3 Test edge cases (empty rows, invalid balances)
- [ ] 6.4 Test large file performance (1000+ rows)
- [ ] 6.5 Test Benford analysis dengan new data format
- [ ] 6.6 Test balance check functionality

## 7. Documentation

- [ ] 7.1 Update README dengan supported GL formats
- [ ] 7.2 Add troubleshooting guide untuk GL upload issues
- [ ] 7.3 Document column mapping rules
- [ ] 7.4 Add sample GL file untuk testing
