import * as pdfjs from "pdfjs-dist";
import { readFile, writeFile } from "fs/promises";

// Use a stable version worker
const PDFJS_VERSION = '4.0.379';

async function testExtraction() {
    const pdfPath = "docs/2024peraturan tk eselon i005.pdf";
    console.log(`Reading PDF from: ${pdfPath}`);
    
    try {
        const buffer = await readFile(pdfPath);
        const uint8Array = new Uint8Array(buffer);
        
        console.log(`File size: ${buffer.length} bytes`);
        console.log("Loading document with CMaps support...");

        const loadingTask = pdfjs.getDocument({
            data: uint8Array,
            // FIX: Use CDN for CMaps to handle custom fonts without crashing
            cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Total pages: ${pdf.numPages}`);

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ");
            
            fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
            console.log(`Page ${i} extracted. Total length: ${fullText.length}`);
        }

        if (fullText.length < 500) {
            console.warn("WARNING: Still very short text!");
        } else {
            console.log("SUCCESS! substansial text extracted.");
            console.log("Preview (first 300 chars):", fullText.substring(0, 300));
        }

        await writeFile("extracted_ts_test.txt", fullText);

    } catch (error: any) {
        console.error("FATAL ERROR:", error.message);
    }
}

testExtraction();
