# Design: UI Re-theme & Significant Location Analysis

## 1. Visual Identity (The Tuft Blue Look)

Kita akan mendefinisikan warna Tuft Blue secara konsisten:
- **Primary:** `#417dc1`
- **Sidebar Background:** `#417dc1`
- **Sidebar Text:** `White` (Bold)
- **Header Background:** `#417dc1`

## 2. Pareto Engine Logic

Fungsi untuk menghitung lokasi signifikan:
1. Ambil `activeSnapshot.rows`.
2. Filter baris yang `fsliName` nya sama dengan `simulation.basis`.
3. Lakukan `reduce` untuk mendapatkan total saldo per `entityCode`.
4. Sortir entitas berdasarkan saldo total (DESC).
5. Hitung `totalBasisAllLocations`.
6. Iterasi entitas:
   - `cumulativeBasis += currentEntityBalance`
   - `cumulativePercent = (cumulativeBasis / totalBasisAllLocations) * 100`
   - `isSignificant = (cumulativePercent - currentEntityPercent) < threshold` (atau variasi logis yang mencakup baris yang menembus batas 80).

## 3. UI Component Structure

```
[ Simulation Table ]
  |-- [ Significant Location Column ]
        |-- [ Button: Open ]
              |-- [ Modal: SignificantLocationModal ]
                    |-- [ Threshold Input: 80% ]
                    |-- [ Data Table (Entity, Balance, Cumulative%, Y/N) ]
                    |-- [ Button: Save to Simulation ]
```

## 4. Entity Update

Interface `MaterialitySimulation` akan diperluas agar hasil analisis ini tidak hilang saat halaman di-refresh.
- `locationThreshold`: Menentukan angka cutoff (default 80).
- `significantLocations`: Menyimpan array objek `{ entityCode: string, balance: number, isSignificant: boolean }`.
