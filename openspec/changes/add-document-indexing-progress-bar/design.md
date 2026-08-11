# Design: Real-time Auto-updating Document AI Indexing Progress Bar

## Architectural Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REAL-TIME DOCUMENT INDEXING PROGRESS FLOW                 │
└─────────────────────────────────────────────────────────────────────────────┘

  [1. User Upload Document]
           │
           ▼
  [2. POST /api/documents] 
   ├── Insert DB `documents` (status = 'processing', indexing_progress = 0)
   ├── Return HTTP 200 (Modal closes in 1-2 sec)
   └── Trigger Background RAG Worker (Fire-and-forget)
           │
           ▼
  [3. Background RAG Worker Execution]
   ├── Loop chunks: chunk 1, chunk 2 ... chunk N
   ├── Every step: UPDATE `documents` SET indexing_progress = Math.round((i+1)/N * 100)
   └── On Finish: UPDATE `documents` SET status = 'completed', indexing_progress = 100
           │
           ▼
  [4. Frontend Auto-Polling (React Query)]
   ├── `useQuery(['documents'], ..., { refetchInterval: hasProcessing ? 3000 : false })`
   └── UI Table Updates Smoothly: [0%] -> [35%] -> [70%] -> [🟢 Siap Ditanyakan]
```

## Detailed Specifications

### 1. Database Schema Updates (`worker/db/schema.ts` & `shared/types.ts`)
- Add `status`: `text("status").default("completed")` (Values: `'processing'`, `'completed'`, `'failed'`).
- Add `indexingProgress`: `integer("indexing_progress").default(100)`.

### 2. Auto-Migration (`worker/db/index.ts`)
Add schema check:
```sql
ALTER TABLE icofr."documents" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'completed';
ALTER TABLE icofr."documents" ADD COLUMN IF NOT EXISTS "indexing_progress" integer DEFAULT 100;
```

### 3. Backend Background Progress Updates (`worker/routes/ai-docs.ts`)
In `processDocumentAsync()` loop:
```typescript
const progress = Math.min(99, Math.round(((i + 1) / chunks.length) * 100));
await db.update(documents)
  .set({ indexingProgress: progress })
  .where(eq(documents.id, docId));
```
At the end of processing:
```typescript
await db.update(documents)
  .set({ status: 'completed', indexingProgress: 100 })
  .where(eq(documents.id, docId));
```

### 4. Frontend Component (`src/pages/knowledge/DocumentsPage.tsx`)
- Detect processing documents: `const hasProcessing = docs?.items?.some(d => d.status === 'processing');`
- Enable polling in React Query: `refetchInterval: hasProcessing ? 3000 : false`.
- Render progress column with Shadcn `Progress` bar component or badge:
  - If `status === 'processing'`: Pulsing Yellow badge + progress bar + `${d.indexingProgress}%`.
  - If `status === 'completed'` (or null): Green Badge "Siap Ditanyakan".
