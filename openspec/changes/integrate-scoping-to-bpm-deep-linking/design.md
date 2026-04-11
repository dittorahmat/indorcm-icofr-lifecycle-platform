# Design: Deep Linking Integration (Scoping to BPM)

## 1. URL Schema

Navigasi akan menggunakan format:
`/bpm?fsli={FSLI_NAME}&noGL={ACCOUNT_CODE}&glDesc={ACCOUNT_DESC}`

## 2. Scoping UI Logic (`GLDataGrid.tsx`)

Dalam renderer kolom `glDesc`:
```typescript
const isInScope = isKuanSignificant || isQualSignificant;

if (isInScope) {
  return (
    <Link 
      to={`/bpm?fsli=${encodeURIComponent(fsliName)}&noGL=${encodeURIComponent(noGL)}&glDesc=${encodeURIComponent(glDesc)}`}
      target="_blank"
      className="text-blue-600 underline hover:text-blue-800 font-medium"
    >
      {glDesc}
    </Link>
  );
}
return <span>{glDesc}</span>;
```

## 3. BPM Page Logic (`BPMPage.tsx`)

Penangkapan parameter di `useEffect`:
1. Ambil params: `fsli`, `noGL`, `glDesc`.
2. Jika ketiganya ada:
   - `setSelectedFsli(fsli)`
   - `setSelectedAccountKey(`${noGL} ||| ${glDesc}`)`
3. Hal ini akan otomatis men-trigger query `bpm-processes` dan merender worksheet di bawahnya.

## 4. Visual Penanda
- Warna: `#2563eb` (Indigo/Blue 600).
- Hover: `#1e40af` (Blue 800).
- Icon: (Opsional) Tambahkan icon `ExternalLink` kecil di samping teks jika diperlukan.
