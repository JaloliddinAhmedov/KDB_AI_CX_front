import * as pdfjsLib from 'pdfjs-dist';

// Use unpkg worker or disable worker for lightweight client-side extraction
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 20); // Extract up to 20 pages
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      
      fullText += `\n--- Page ${pageNum} ---\n` + pageText;
    }

    return fullText.trim();
  } catch (error) {
    console.warn('PDF extraction failed with pdfjs, attempting fallback:', error);
    const raw = await file.text();
    const cleaned = raw.replace(/[^\x20-\x7E\t\r\n\u0400-\u04FF\u00A0-\u00FF]/g, ' ').trim();
    return cleaned;
  }
}
