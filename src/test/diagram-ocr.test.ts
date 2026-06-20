import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressAndScaleImage } from '../utils/diagram-parser';

describe('Diagram OCR Frontend Utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('compressAndScaleImage scales image down proportionally when dimensions exceed maxDimension', async () => {
    // Keep reference to the original element creator
    const originalCreateElement = document.createElement.bind(document);
    
    const widths: number[] = [];
    const heights: number[] = [];
    const mockCanvas = {
      get width() { return 0; },
      set width(val) { widths.push(val); },
      get height() { return 0; },
      set height(val) { heights.push(val); },
      getContext: () => ({
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockscaledbase64data'),
    };
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement(tagName);
    });

    class LargeImageMock {
      naturalWidth = 3000;
      naturalHeight = 1500;
      width = 3000;
      height = 1500;
      onload: any = null;
      onerror: any = null;
      set src(value: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }

    Object.defineProperty(window, 'Image', { value: LargeImageMock, configurable: true, writable: true });
    Object.defineProperty(global, 'Image', { value: LargeImageMock, configurable: true, writable: true });
    Object.defineProperty(globalThis, 'Image', { value: LargeImageMock, configurable: true, writable: true });

    const result = await compressAndScaleImage('data:image/png;base64,sourceimage', 2048);
    
    expect(widths).toContain(2048);
    expect(heights).toContain(1024); // 1500 * 2048 / 3000 = 1024
    expect(result).toBe('data:image/png;base64,mockscaledbase64data');
  });

  it('compressAndScaleImage keeps original dimensions when image is smaller than maxDimension', async () => {
    const originalCreateElement = document.createElement.bind(document);
    
    const widths: number[] = [];
    const heights: number[] = [];
    const mockCanvas = {
      get width() { return 0; },
      set width(val) { widths.push(val); },
      get height() { return 0; },
      set height(val) { heights.push(val); },
      getContext: () => ({
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockdata'),
    };
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return originalCreateElement(tagName);
    });

    class SmallImageMock {
      naturalWidth = 1000;
      naturalHeight = 800;
      width = 1000;
      height = 800;
      onload: any = null;
      onerror: any = null;
      set src(value: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }

    Object.defineProperty(window, 'Image', { value: SmallImageMock, configurable: true, writable: true });
    Object.defineProperty(global, 'Image', { value: SmallImageMock, configurable: true, writable: true });
    Object.defineProperty(globalThis, 'Image', { value: SmallImageMock, configurable: true, writable: true });

    const result = await compressAndScaleImage('data:image/png;base64,sourceimage', 2048);
    
    expect(widths).toContain(1000);
    expect(heights).toContain(800);
    expect(result).toBe('data:image/png;base64,mockdata');
  });
});
