import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseRCMSpreadsheet } from '../rcm-spreadsheet-parser';
import { summarizeRcmRows, buildRcmImportPayload } from '../rcm-ingestion';

describe('Multi-Process RCM Spreadsheet Parser & Ingestion', () => {
  it('parses extended multi-process sample_2027_tlc.csv cleanly across all processes', () => {
    const csvPath = path.resolve(__dirname, '../../editor/fixtures/sample_2027_tlc.csv');
    const content = fs.readFileSync(csvPath, 'utf8');

    const result = parseRCMSpreadsheet(content, 'TLC');

    expect(result.errors).toEqual([]);
    expect(result.rows.length).toBe(13);

    // Verify 1-to-N Mapping: Multiple controls share the same stepRef '1.2' within P2P
    const p2pStep12Rows = result.rows.filter(
      (r) => r.processName === 'Procure-to-Pay' && r.bpmNodeRef === '1.2'
    );
    expect(p2pStep12Rows.length).toBe(2);
    expect(p2pStep12Rows[0].controlCode).toBe('CTRL-P2P-2027-001');
    expect(p2pStep12Rows[1].controlCode).toBe('CTRL-P2P-2027-001B');
    expect(p2pStep12Rows[0].bpmNodeName).toBe('Verifikasi Uji Tuntas Rekanan Baru');
    expect(p2pStep12Rows[1].bpmNodeName).toBe('Verifikasi Uji Tuntas Rekanan Baru');

    // Also note Composite Scoping: O2C also has a stepRef '1.2' under its own sub-process
    const o2cStep12Rows = result.rows.filter(
      (r) => r.processName === 'Order-to-Cash' && r.bpmNodeRef === '1.2'
    );
    expect(o2cStep12Rows.length).toBe(1);
    expect(o2cStep12Rows[0].controlCode).toBe('CTRL-O2C-2027-001');

    const processes = [...new Set(result.rows.map((r) => r.processName))];
    expect(processes).toContain('Procure-to-Pay');
    expect(processes).toContain('Order-to-Cash');
    expect(processes).toContain('Hire-to-Retire');
    expect(processes).toContain('Record-to-Report');

    const subProcesses = [...new Set(result.rows.map((r) => r.subProcessName))];
    expect(subProcesses.length).toBeGreaterThanOrEqual(6);

    const summary = summarizeRcmRows(result.rows);
    expect(summary.invalidRowCount).toBe(0);
    expect(summary.canProceed).toBe(true);

    const payload = buildRcmImportPayload({
      flavor: 'TLC',
      workingYear: '2027',
      rows: result.rows,
    });

    expect(payload.rows.length).toBe(13);
    expect(payload.bpmProcessId).toBeUndefined();
    expect(payload.diagramId).toBeUndefined();
  });
});
