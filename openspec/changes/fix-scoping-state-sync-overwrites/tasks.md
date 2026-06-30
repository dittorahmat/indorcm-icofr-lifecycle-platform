## 1. Implement State Protection in Hook

- [x] 1.1 Add a `useRef` to track `initialSimulation.id` inside the `useScopingEditor` hook in `src/pages/scoping/hooks/useScopingPage.ts`
- [x] 1.2 Modify the `useEffect` that synchronizes `simState` from `initialSimulation` to only trigger if the simulation ID changes, or if the form is clean (`isDirty === false`)
- [x] 1.3 Update the `useEffect` that updates `localDeptMappings` to check `isDirty` and simulation ID change before resetting the mapping
- [x] 1.4 Guard the initial mappings effect for `localAppMappings` with simulation ID tracking and `isDirty` state

## 2. Verify Scoping Integrity and Code Quality

- [x] 2.1 Verify that typescript compilation passes using `npm run type-check`
- [x] 2.2 Verify code lint standards using `npm run lint`
- [x] 2.3 Run compilation check using `npm run build`
