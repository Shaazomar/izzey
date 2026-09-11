import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export interface PDFVerificationResult {
  isValid: boolean;
  fileSize: number;
  pageCount: number;
  error?: string;
}

/**
 * Verify generated PDF buffer or file on disk
 */
export async function verifyPDF(fileInput: string | Uint8Array, expectedPages = 1): Promise<PDFVerificationResult> {
  try {
    let pdfBytes: Uint8Array;
    let fileSize = 0;

    if (typeof fileInput === 'string') {
      if (!fs.existsSync(fileInput)) {
        return { isValid: false, fileSize: 0, pageCount: 0, error: `File does not exist on disk: ${fileInput}` };
      }
      const stats = fs.statSync(fileInput);
      fileSize = stats.size;
      if (fileSize === 0) {
        return { isValid: false, fileSize: 0, pageCount: 0, error: 'Generated PDF file is empty (0 bytes).' };
      }
      pdfBytes = fs.readFileSync(fileInput);
    } else {
      pdfBytes = fileInput;
      fileSize = pdfBytes.length;
      if (fileSize === 0) {
        return { isValid: false, fileSize: 0, pageCount: 0, error: 'Generated PDF buffer is empty (0 bytes).' };
      }
    }

    // Attempt to load and parse PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return { isValid: false, fileSize, pageCount: 0, error: 'PDF contains 0 pages.' };
    }

    if (expectedPages > 0 && pageCount < expectedPages) {
      return { 
        isValid: false, 
        fileSize, 
        pageCount, 
        error: `Page count mismatch. Expected at least ${expectedPages} page(s), got ${pageCount}.` 
      };
    }

    return {
      isValid: true,
      fileSize,
      pageCount,
    };
  } catch (err: any) {
    console.error('PDF verification error:', err);
    return {
      isValid: false,
      fileSize: 0,
      pageCount: 0,
      error: `PDF structural verification failed: ${err?.message || 'Corrupted PDF file.'}`,
    };
  }
}
