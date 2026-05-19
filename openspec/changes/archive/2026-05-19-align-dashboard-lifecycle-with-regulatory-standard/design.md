# Design: Align Dashboard Lifecycle with Regulatory Standard

## Component Structure

### `LifecycleProgress.tsx`
The `stages` array will be updated to reflect the 6 regulatory stages.

```typescript
const stages = [
  { id: 'perancangan', label: 'dashboard:lifecycle.perancangan', icon: Circle },
  { id: 'implementasi', label: 'dashboard:lifecycle.implementasi', icon: Circle },
  { id: 'evaluasi', label: 'dashboard:lifecycle.evaluasi', icon: Circle },
  { id: 'remediasi', label: 'dashboard:lifecycle.remediasi', icon: Circle },
  { id: 'pelaporan', label: 'dashboard:lifecycle.pelaporan', icon: Circle },
  { id: 'asurans', label: 'dashboard:lifecycle.asurans', icon: Circle },
];
```

## Localization Strategy

Update `src/i18n/locales/id/dashboard.json` and `src/i18n/locales/en/dashboard.json`.

### Stage Mapping (id)
1. **Perancangan**: Perancangan
2. **Implementasi & Pemantauan**: Implementasi & Pemantauan
3. **Evaluasi**: Evaluasi
4. **Remediasi**: Remediasi
5. **Pelaporan**: Pelaporan
6. **Asurans Eksternal**: Asurans Eksternal

### Stage Mapping (en)
1. **Perancangan**: Planning
2. **Implementasi & Pemantauan**: Implementation & Monitoring
3. **Evaluasi**: Evaluation
4. **Remediasi**: Remediation
5. **Pelaporan**: Reporting
6. **Asurans Eksternal**: External Assurance

## Dashboard Logic

Update `src/pages/Dashboard.tsx` to use the new stage IDs. Default `currentStage` will be set to `evaluasi` (replacing the previous `execution`).
