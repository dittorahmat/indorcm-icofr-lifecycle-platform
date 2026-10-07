import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/default
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Returns total number of pages in a PDF file.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  return pdf.numPages;
}

/**
 * Converts all or selected pages of a PDF into compressed base64 image strings.
 */
export async function renderAllPdfPagesToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const results: string[] = [];

  for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
    onProgress?.(pageNumber, total);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    canvas.width = 0;
    canvas.height = 0;

    results.push(dataUrl);
  }

  return results;
}


/**
 * Compresses and scales down an image (File or base64 DataURL) so that its maximum dimension
 * does not exceed the target size (default 2048px). Returns a base64 PNG data URL.
 */
export async function compressAndScaleImage(
  source: File | string,
  maxDimension: number = 2048
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down if either dimension exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context for compression'));
        return;
      }

      // Draw and export as JPEG for high visual fidelity with much smaller payload
      ctx.drawImage(img, 0, 0, width, height);
      const output = canvas.toDataURL('image/jpeg', 0.85);
      
      // Clean up
      canvas.width = 0;
      canvas.height = 0;
      
      resolve(output);
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image source for compression: ' + String(err)));
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read File buffer'));
        }
      };
      reader.onerror = () => reject(new Error('File reader error'));
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}
