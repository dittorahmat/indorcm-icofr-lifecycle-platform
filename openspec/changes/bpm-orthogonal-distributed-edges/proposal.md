# Proposal: Garis Siku dan Distribusi Titik Konektor BPM Flowchart

## Why
Pada komponen BPM Editor (`BPMEditor.tsx`), garis alur antar node saat ini menggunakan Bezier curve (lengkung) dan menumpuk di 1 titik konektor (center handle) per sisi node. Sesuai dengan screenshot acuan sampel flowchart standar, alur flowchart harus menggunakan **garis berbentuk siku (orthogonal/smoothstep)** serta konektor garis panah masuk/keluar pada sisi node rectangular (seperti Activity, Document, System, Data) yang **tersebar/terdistribusi secara rapi**, bukan menumpuk pada satu titik pusat.

## Change Description
1. Mengubah alur garis default di `BPMEditor.tsx` dan `BridgeEdge.tsx` agar menggunakan **garis siku (Orthogonal / SmoothStep path)** dengan dukungan fitur bridge (lengkungan bersilangan) jika ada dua garis yang bertabrakan.
2. Mengimplementasikan **Dynamic Edge Port Distribution**:
   - Untuk node berbentuk persegi/kontainer (Activity, Manual Input, Automated Activity, Document, Data, dll), titik target/source konektor pada sisi yang sama akan di-offset secara merata (*equally distributed*) berdasarkan jumlah total edge yang tersambung ke sisi tersebut.
   - Untuk node berbentuk diamond/lingkaran (Decision, Start, End, Reference, Off-Page Ref), titik target/source konektor **tetap mengunci (*locked/fixed*) tepat di sudut/titik pusat lancip** agar visual diagram presisi dan tidak lepas dari sudutnya.

## Impacted Artifacts
- `src/components/rcm/edges/BridgeEdge.tsx`
- `src/components/rcm/BPMEditor.tsx`
- `src/components/rcm/nodes/BPMCustomNodes.tsx` (jika dibutuhkan penyesuaian handle ref/data)
