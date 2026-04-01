## 1. Test Workbench Access

- [x] 1.1 Remove Line 3 only restriction dari `TestWorkbench.tsx`
- [x] 1.2 Update access denied message atau remove completely

## 2. Deficiency Board Access

- [x] 2.1 Remove Line 2/3 only restriction dari `DeficiencyBoard.tsx`
- [x] 2.2 Update access denied logic

## 3. CSA Workspace Access

- [x] 3.1 Remove Line 1/2 only restriction dari `CSAWorkspace.tsx`
- [x] 3.2 Update access denied logic

## 4. Import Page Access

- [x] 4.1 Remove Line 2 only restriction dari `ImportPage.tsx`
- [x] 4.2 Enable upload/download untuk semua roles

## 5. Scoping Page Access

- [x] 5.1 Remove Line 2 only checks dari `ScopingPage.tsx`
- [x] 5.2 Enable GL Upload dan ERP Sync untuk semua roles

## 6. RCM List Access

- [x] 6.1 Remove Line 2 validation restrictions dari `RCMList.tsx`
- [x] 6.2 Enable approve/reject untuk semua roles

## 7. Verification

- [x] 7.1 Test login sebagai Line 1 dan akses semua halaman
- [x] 7.2 Test login sebagai Line 2 dan akses semua halaman
- [x] 7.3 Test login sebagai Line 3 dan akses semua halaman
- [x] 7.4 Verify audit trail masih record role dengan benar
- [x] 7.5 Verify type check passes (bunx tsc --noEmit)
