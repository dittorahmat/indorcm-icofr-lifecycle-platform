import { describe, it, expect, vi } from 'vitest';
import { parseGLFile } from './gl-parser';

// Mock FileReader and crypto
class MockFileReader {
  onload: any = null;
  readAsBinaryString(file: any) {
    setTimeout(() => {
      this.onload({ target: { result: file.content } });
    }, 0);
  }
  readAsText(file: any) {
    this.readAsBinaryString(file);
  }
}

vi.stubGlobal('FileReader', MockFileReader);
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

describe('gl-parser', () => {
  it('should preserve rows with fsliName even if glDesc is empty', async () => {
    const csvContent = `No_GL,GL_Desc,GL_Balance,FSLI,No_Urut
101,Kas di Bank,1000,Kas,1
,,5000,TOTAL ASET,10
102,Piutang,4000,Piutang,2`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    // @ts-expect-error - injecting content for mock
    file.content = csvContent;

    const result = await parseGLFile(file);

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(3);
    
    const subtotalRow = result.rows.find(r => r.fsliName === 'TOTAL ASET');
    expect(subtotalRow).toBeDefined();
    expect(subtotalRow?.glDesc).toBe('');
    expect(subtotalRow?.balance).toBe(5000);
    expect(subtotalRow?.noUrut).toBe(10);
  });

  it('should filter out rows that have neither glDesc nor fsliName', async () => {
    const csvContent = `No_GL,GL_Desc,GL_Balance,FSLI,No_Urut
101,Kas di Bank,1000,Kas,1
,,, ,
102,,4000,,2`; // Neither glDesc nor fsliName

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    // @ts-expect-error - injecting content for mock
    file.content = csvContent;

    const result = await parseGLFile(file);

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].glDesc).toBe('Kas di Bank');
  });
});
