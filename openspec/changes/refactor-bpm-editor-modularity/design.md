# Design: BPMEditor Modularity Refactoring

## 1. Architectural Overview
Pemecahan `BPMEditor.tsx` dari 2.100+ LOC menjadi beberapa sub-komponen terdedikasi di `src/components/rcm/editor/`:

```
src/components/rcm/
├── BPMEditor.tsx                 # Core orchestrator (~500 LOC)
└── editor/
    ├── BPMCanvasToolbar.tsx      # Top canvas toolbar (~120 LOC)
    ├── BPMShapePalette.tsx       # Left palette & migration backlog (~180 LOC)
    ├── BPMSelectionHUD.tsx       # Bottom selection indicator HUD (~90 LOC)
    ├── BPMOcrModal.tsx           # Full AI OCR upload & staging dialog (~320 LOC)
    └── BPMDocumentView.tsx       # Document preview & PDF export (~120 LOC)
```

## 2. Component Contracts & Interfaces

### 2.1 `BPMCanvasToolbar`
```typescript
interface BPMCanvasToolbarProps {
  subProcess: string;
  canUndo: boolean;
  canRedo: boolean;
  isLocked: boolean;
  isSaving: boolean;
  hasNodes: boolean;
  globalScale: number;
  selectedGLs: string[];
  glOptions: { label: string; value: string }[];
  onUndo: () => void;
  onRedo: () => void;
  onAutoArrange: () => void;
  onOpenDocumentView: () => void;
  onOpenOcrDialog: () => void;
  onScaleChange: (scale: number) => void;
  onSelectedGLsChange: (gls: string[]) => void;
  onSave: () => void;
}
```

### 2.2 `BPMShapePalette`
```typescript
interface BPMShapePaletteProps {
  subProcess: string;
  isLocked: boolean;
  onCreateActivityNode: (type: string) => void;
  onCreateSwimlane: () => void;
  unmappedControls: any[];
}
```

### 2.3 `BPMSelectionHUD`
```typescript
interface BPMSelectionHUDProps {
  selectedNode: Node | undefined;
  selectedEdge: Edge | undefined;
  isLocked: boolean;
  onToggleLock: (nodeId: string) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}
```

### 2.4 `BPMOcrModal`
```typescript
interface BPMOcrModalProps {
  isOpen: boolean;
  isLocked: boolean;
  isDirty: boolean;
  onClose: () => void;
  onApplyDiagram: (nodes: Node[], edges: Edge[]) => void;
}
```

### 2.5 `BPMDocumentView`
```typescript
interface BPMDocumentViewProps {
  subProcess: string;
  workingYear: string;
  isDirty: boolean;
  fsliName: string;
  nodes: Node[];
  edges: Edge[];
  globalScale: number;
  signatures: any;
  isLocked: boolean;
  nodeTypes: any;
  onClose: () => void;
  onExportToImage: () => void;
  onChangeSignature: (key: string, val: string) => void;
}
```

## 3. Migration Strategy
1. Buat folder `src/components/rcm/editor/`.
2. Ekstrak satu per satu komponen murni tampilan terlebih dahulu (`BPMSelectionHUD`, `BPMCanvasToolbar`).
3. Ekstrak `BPMShapePalette` dan `BPMDocumentView`.
4. Ekstrak `BPMOcrModal` lengkap dengan logic staging state-nya.
5. Bersihkan import dan baris kode berlebih di `BPMEditor.tsx`.
6. Jalankan siklus Mandat Penyelesaian Tahap (`type-check`, `lint`, `test`, `build`).
