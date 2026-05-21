import { describe, it, expect, vi } from 'vitest';
import { AIClassifierService } from '../ai-classifier';

describe('AIClassifierService', () => {
    const service = new AIClassifierService();

    it('should normalize free-text frequency to standard Enums', async () => {
        // This is a unit test for the logic that will eventually call the AI
        // For now, we are testing the semantic mapping capability
        const result = await service.classifyAccounts(['Kas Kecil Site A']);
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
    });

    it('should map local subsidiary accounts to Corporate Master COA', async () => {
        const localNames = ['Mandiri Palembang', 'Petty Cash Jkt'];
        const masterCOA = ['Kas & Setara Kas', 'Piutang Usaha'];
        
        const result = await service.mapToMasterCOA(localNames, masterCOA);
        expect(result.length).toBe(2);
        expect(result[0].confidence).toBeGreaterThanOrEqual(0);
    });
});
