## 1. Backend Permissions Update

- [x] 1.1 Update `POST /api/bpm-processes` to include 'Line 1' in `rbac`
- [x] 1.2 Update `PATCH /api/bpm-processes/:id` to include 'Line 1' in `rbac`
- [x] 1.3 Update `DELETE /api/bpm-processes/:id` to include 'Line 1' in `rbac`

## 2. Verification

- [x] 2.1 Verify that a 'Line 1' user can now create a BPM process
- [x] 2.2 Verify that a 'Line 1' user can now update a BPM process
- [x] 2.3 Verify that an 'Admin' user still has access
- [x] 2.4 Verify that 'Line 2' users (if intentionally excluded) are denied access or (if included) still have access
