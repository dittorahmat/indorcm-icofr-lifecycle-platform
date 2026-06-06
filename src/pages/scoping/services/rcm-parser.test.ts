import { describe, it, expect } from 'vitest';
import { parseRCMFile } from './rcm-parser';

// Mock File for testing
const createMockFile = (content: string, name: string) => {
    return new File([content], name, { type: 'text/csv' });
};

describe('RCM Parser (SK-5)', () => {
    it('should parse TLC with assertions correctly', async () => {
        const csv = `No,Informasi_Proses_Bisnis,Informasi_Sub_proses_Bisnis,Perusahaan_Pelaksana_Proses_Bisnis,Lokasi_Dilaksanakannya_Proses_Bisnis,Risiko_Aktivitas_Pengendalian,Risiko_Terkait_Fraud,Penilaian_Risiko,Referensi_Pengendalian,Nama_Aktivitas_Pengendalian,Deskripsi_Aktivitas_Pengendalian,Dokumen_Pendukung,Pengendalian_Utama,IPO_C,IPO_A,IPO_V,IPO_RA,Asersi_C,Asersi_A,Asersi_E_O,Asersi_CO,Asersi_R_O,Asersi_V_A,Asersi_PD,Preventif_Detektif,Sifat_Pelaksanaan_Pengendalian,Jenis_Pengendalian_Otomatis,Frekuensi_Pelaksanaan_Aktivitas,Aplikasi_Pendukung,Fungsi_Pelaksana_Aktivitas,Pelaku_Pengendalian,Item_Laporan_Keuangan_yang_Terdampak,Periode_Efektif
1,Kas,Bank,HOLDING,Jakarta,Double pay,T,High,TLC-01,Bank Rec,Desc,Docs,Y,Y,Y,Y,T,Y,Y,Y,Y,T,Y,T,Detective,Manual,,Monthly,,Acc,Mgr,Cash,2024`;
        const file = createMockFile(csv, 'tlc.csv');
        const result = await parseRCMFile(file, 'TLC');
        
        expect(result.success).toBe(true);
        expect(result.rows.length).toBeGreaterThan(0);
        expect(result.rows[0].ipoC).toBe(true);
        expect(result.rows[0].assertionC).toBe(true);
    });

    it('should parse ELC with COSO principles correctly', async () => {
        const csv = `Referensi_Pengendalian,Aktivitas_Pengendalian,Frekuensi_Pengendalian,Dokumen_Pengendalian,Fungsi_Pelaksana_Aktivitas_Pengendalian,Pelaku_Pengendalian,Periode_Efektif,Prinsip_COSO
ELC-01,Ethics,Annual,Docs,HR,CEO,2024,"1, 2, 5"`;
        const file = createMockFile(csv, 'elc.csv');
        const result = await parseRCMFile(file, 'ELC');
        
        expect(result.success).toBe(true);
        expect(result.rows[0].cosoPrinciples).toEqual([1, 2, 5]);
    });

    it('should validate ITGC mandatory app field', async () => {
        const csv = `No,Informasi_Proses_Bisnis,Informasi_Sub_proses_Bisnis,Perusahaan_Pelaksana_Proses_Bisnis,Lokasi_Dilaksanakannya_Proses_Bisnis,Risiko_Aktivitas_Pengendalian,Referensi_Pengendalian,Nama_Aktivitas_Pengendalian,Deskripsi_Aktivitas_Pengendalian,Dokumen_Pendukung,Pengendalian_Utama,Preventif_Detektif,Sifat_Pelaksanaan_Pengendalian,Jenis_Pengendalian_Otomatis,Frekuensi_Pelaksanaan_Aktivitas,Aplikasi_Pendukung,Fungsi_Pelaksana_Aktivitas,Pelaku_Pengendalian,Periode_Efektif
1,IT,Access,HOLDING,JKT,Risk,ITGC-01,Review,Desc,Docs,Y,Prev,Manual,,Daily,,IT,Mgr,2024`;
        const file = createMockFile(csv, 'itgc.csv');
        const result = await parseRCMFile(file, 'ITGC');
        
        expect(result.success).toBe(true);
        expect(result.rows[0].isValid).toBe(false); // Validasi gagal karena Aplikasi_Pendukung kosong
    });
});
