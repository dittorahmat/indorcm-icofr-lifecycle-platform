## 1. Implement Conditional Rendering in RCMELCPage

- [x] 1.1 Update `RCMELCPage` to return only `content` if `embedded` is true.

## 2. Implement Conditional Rendering in RCMITGCPage

- [x] 2.1 Update `RCMITGCPage` to return only `content` if `embedded` is true.

## 3. Verify Integration in BPMModal

- [x] 3.1 Verify `BPMModal` correctly passes the `embedded={true}` prop to `RCMTLCPage`, `RCMELCPage`, and `RCMITGCPage`.
- [x] 3.2 Perform manual check (or dry run) of the UI structure to ensure the sidebar is absent in the modal.

## 4. Final Polish and Validation

- [x] 4.1 Run `npm run type-check` to ensure no regressions.
- [x] 4.2 Run `npm run build` to verify the build process.
