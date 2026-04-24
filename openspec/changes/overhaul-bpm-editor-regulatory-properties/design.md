# Design: Regulatory Property Panel & Unique Mapping

## Architecture
Kita akan memisahkan logika panel properti dari `BPMEditor.tsx` menjadi komponen mandiri `RegulatoryPropertyPanel.tsx`.

### 1. Component Structure
- **Container**: `Sheet` (shadcn/ui) untuk area kerja yang lebih luas.
- **State Management**: Data akan dikelola oleh `useNodesState` di React Flow, namun akan disinkronkan ke database via `useMutation` setiap kali ada perubahan signifikan (autosave/snapshot).

### 2. ID Generation Logic (Requirement 3)
```typescript
const generateUniqueId = (prefix: 'R' | 'C', existingNodes: Node[]) => {
  const count = existingNodes.filter(n => n.data.code?.startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3, '0')}`;
}
```
Setiap node `activity` akan memiliki object `regulatoryData` di dalam `node.data`.

### 3. Dynamic Form Logic
Panel akan menggunakan state `classification` (TLC | ELC | ITGC) untuk merender sub-form:
- **TLCView**: Merender `IPOTable` dengan tooltips.
- **ELCView**: Merender grid `COSOPmapping` (17 principles).
- **ITGCView**: Merender `ITGCDomainSelector` dan `ITGCAssertionDummy`.

### 4. Database Mapping
Data yang diinput di panel akan langsung disimpan ke tabel:
- `rcms`: Untuk deskripsi risiko, rating, dan status fraud.
- `controls`: Untuk deskripsi kontrol, status key control, dan asersi.
- `rcm_control_mapping`: Untuk menyimpan relasi unik antara keduanya untuk node spesifik tersebut.

### 5. Double-Layer Safety Mechanism
Untuk mencegah kehilangan data pada alur BPM yang kompleks:
- **Layer 1 (Internal):** Menggunakan hook `useUnsavedChanges` yang memanfaatkan React Router `useBlocker` (atau sejenisnya) untuk menampilkan dialog konfirmasi kustom jika `isDirty` bernilai `true`.
- **Layer 2 (External):** Menambahkan event listener `beforeunload` pada `window` untuk menangkap aksi tutup tab, refresh, atau tombol *back* browser.

### 6. Localization Strategy
Semua teks teknis dan tooltip akan dipindahkan ke file JSON:
- Tooltip IPO (Completeness, Accuracy, etc.) akan diletakkan di `bpm.json` seksi `assertions.tooltip`.
- Label-label baru pada panel properti akan menggunakan namespace `rcm` atau `bpm`.
