## Context

**Current State:**
- Mock data tercampur: P2P, R2R, Oil & Gas, generic scenarios
- Tidak fokus pada satu industri spesifik
- BPM diagrams masih simple (2-3 nodes saja)
- GL data belum mencerminkan kompleksitas coal mining

**Constraints:**
- Simplified untuk demo (round numbers, clear scenarios)
- Harus comply dengan SK-5/DKU.MBU/11/2024 Lampiran 2
- React Flow compatible BPM format
- Single entity only (PT Kaltim Prima Coal)

**Stakeholders:**
- Demo audience: Management BUMN, regulator, KAP
- Users: Line 1 (Process Owner), Line 2 (ICOFR Manager), Line 3 (Internal Auditor)
- Industry context: Coal mining (open-pit, 5M MT/year)

## Goals / Non-Goals

**Goals:**
- Comprehensive coal mining mock data (GL, RCM, Controls, Deficiencies)
- Realistic BPM diagrams (5-6 workflows dengan 8-10 nodes each)
- Simplified numbers untuk demo (easy to remember)
- SK-5 compliance (Lampiran 2 - Industri Mineral dan Batubara)
- Replace all existing mock data (no mixing)

**Non-Goals:**
- Multi-entity consolidation (holdco/subsidiary structure)
- Complex hedging/derivatives scenarios
- Full ITGC control documentation
- Actual historical data (ini mockup untuk demo)

## Decisions

### 1. Entity Structure

**Decision**: PT Batubara Nusantara Sejahtera - Single Mining Entity

**Profile:**
```
Company: PT Batubara Nusantara Sejahtera
Location: Kalimantan Timur
Type: Open-pit coal mining
Capacity: 5 million MT/year
Sales Mix: 70% Export, 30% Domestic (PLN)
Pricing: HBA (Harga Batubara Acuan)
```

**Rationale:**
- Simplified structure (no consolidation complexity)
- Representative untuk coal mining industry
- Easy to understand business flow

**Alternatives Considered:**
- Holding with subsidiaries → terlalu kompleks untuk demo
- Multiple mine sites → simplify to single location

### 2. Mock Data Scope

**Decision**: Core ICOFR Data Only (Level 2 Completeness)

**Included:**
- GL Data: 50-60 accounts (balance sheet + P&L)
- RCM: 8 processes dengan BPM diagrams
- Controls: 25-30 controls (all types)
- Deficiencies: 5-8 scenarios
- Risk Library: 15-20 mining-specific risks
- Materiality & Scoping: Complete package

**Excluded:**
- CSA assessments (future enhancement)
- Test results (TOD/TOE) - future
- Change logs - future
- SOC reports - future

**Rationale:**
- Focus pada core ICOFR requirements
- Manageable size untuk demo
- Leave room for future enhancements

### 3. BPM Diagram Format

**Decision**: React Flow Native Format

**Format:**
```typescript
{
  nodes: [
    { id: 'n1', type: 'start', position: {x, y}, data: {label, type} },
    { id: 'n2', type: 'activity', position: {x, y}, data: {label, role} },
    { id: 'n3', type: 'risk', position: {x, y}, data: {label} },
    { id: 'n4', type: 'control', position: {x, y}, data: {label, code} },
    { id: 'n5', type: 'end', position: {x, y}, data: {label, type} }
  ],
  edges: [
    { id: 'e1-2', source: 'n1', target: 'n2' }
  ]
}
```

**Node Types:**
- `start`: Oval (green) - Process start
- `activity`: Rectangle (blue) - Business activity
- `risk`: Hexagon (red) - Risk point
- `control`: Cylinder (orange) - Control point
- `end`: Oval (green) - Process end
- `archive`: Cylinder (gray) - Documentation

**Rationale:**
- Native support di aplikasi (React Flow)
- Consistent dengan existing BPM format
- Easy to maintain dan extend

### 4. Key Business Processes

**Decision**: 8 Core Mining Processes

**Revenue & Receivables (3 RCMs):**
1. Coal Sales Contract
2. Weighbridge & Quality Measurement
3. Revenue Recognition (HBA Pricing)

**Production & Inventory (2 RCMs):**
4. Coal Extraction
5. Stockpile Management

**Procure to Pay (1 RCM):**
6. Mining Contractor Services

**Fixed Assets (1 RCM):**
7. Mine Development (Capex)

**Reclamation (1 RCM):**
8. ARO Provision & Progressive Reclamation

**Rationale:**
- Cover end-to-end mining value chain
- High-risk areas per SK-5 Lampiran 2
- Representative untuk demo scenarios

### 5. Data Realism Level

**Decision**: Simplified for Demo

**Approach:**
- Round numbers (15B, 25B, 100B - easy to remember)
- Clear cause-effect relationships
- Obvious control deficiencies
- Minimal edge cases

**Example:**
```
Revenue: Rp 350B (5M MT × HBA 70 USD × 14,000)
COGS: Rp 175B (50% of revenue - simplified)
Gross Profit: Rp 175B (50% margin)
```

**Rationale:**
- Easy to explain during demo
- Audience can follow calculations
- Focus on ICOFR concepts, not accounting complexity

**Alternatives Considered:**
- Realistic complexity → terlalu sulit untuk demo
- Actual industry data → confidentiality issues

## Risks / Trade-offs

**[Risk]** Mock data terlalu simplified, tidak mencerminkan realitas

**→ Mitigation:**
- Include realistic scenarios (HBA pricing, quality claims)
- Add complexity notes dalam comments
- Can enhance later dengan CSA/test data

**[Risk]** BPM diagrams terlalu basic

**→ Mitigation:**
- Include 8-10 nodes per workflow
- Add decision points (YES/NO branches)
- Include roles/responsibilities

**[Risk]** Breaking change - existing demo users confused

**→ Mitigation:**
- Clear commit message: "BREAKING: Replace mock data with coal mining"
- Update README dengan new context
- Document what changed

**[Trade-off]** Single entity vs multi-entity

**→ Acceptable** karena:
- Demo purpose (bukan production)
- Can expand later dengan holdco structure
- Focus pada ICOFR quality, bukan consolidation complexity

**[Trade-off]** Replace all vs merge with existing

**→ Acceptable** karena:
- Clean slate (no mixing industries)
- Consistent narrative (coal mining only)
- Easier maintenance

## Migration Plan

### Steps to Deploy

1. **Backup existing mock-data.ts** (optional, for reference)
   ```bash
   cp shared/mock-data.ts shared/mock-data.backup.ts
   ```

2. **Replace mock-data.ts** dengan coal mining data
   - GL accounts (50-60)
   - RCMs (8 dengan BPM)
   - Controls (25-30)
   - Deficiencies (5-8)
   - Risk Library (15-20)

3. **Update seed data** di worker/entities.ts (if needed)

4. **Test** semua scenarios:
   - Login → Dashboard
   - Scoping → Materiality
   - RCM → Controls
   - Deficiencies → Action Plans

5. **Verify** BPM diagrams render correctly

### Rollback Strategy

Simple - restore backup:
```bash
cp shared/mock-data.backup.ts shared/mock-data.ts
git checkout shared/mock-data.ts  # if committed
```

No database changes, safe rollback.

## Open Questions

1. **Should we include ITGC controls explicitly?**
   - SAP access controls
   - Weighbridge system controls
   - SCADA system for production monitoring
   - **Lean toward**: Yes, 3-4 ITGC controls

2. **How many deficiency scenarios?**
   - Option A: 5 (manageable)
   - Option B: 8 (more comprehensive)
   - **Lean toward**: 5-6 high-quality scenarios

3. **BPM detail level?**
   - Simple: 5-6 nodes per workflow
   - Detailed: 8-10 nodes per workflow
   - **Lean toward**: 8-10 nodes (more realistic)

4. **Include related party transactions?**
   - Export sales to parent company
   - Transfer pricing scenarios
   - **Lean toward**: No (too complex for demo)

5. **Hedging/derivatives?**
   - Coal price hedging
   - FX forward contracts
   - **Lean toward**: No (simplify for demo)
