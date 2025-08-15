// No static imports needed since we're using dynamic imports

export class ScraperAgent {
  /**
   * Extracts text content from a resume file using appropriate parsing library based on file type.
   * Note: DOCX files are now pre-processed into plain text by the upload component.
   * @param file - The resume file to parse
   * @returns Promise resolving to the extracted text content
   */
  async extractTextContent(file: File): Promise<string> {
    try {
      // Determine the file type and use appropriate parser
      if (file.type === 'application/pdf') {
        return await this.extractPdfText(file);
      } else if (file.type.startsWith('image/')) {
        return await this.extractImageText(file);
      } else {
        // For text files, read directly
        return await file.text();
      }
    } catch (error: any) {
      console.error('Error extracting text content from resume:', error);
      throw new Error(`Failed to extract text content from resume: ${error.message}`);
    }
  }
  
  /**
   * Extracts text from a PDF file
   * @param file - The PDF file to parse
   * @returns Promise resolving to the extracted text
   */
  private async extractPdfText(file: File): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      await import('pdfjs-dist/build/pdf.worker.mjs');
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText;
    } catch (error: any) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
  
  /**
   * Extracts text from an image file using OCR
   * @param file - The image file to parse
   * @returns Promise resolving to the extracted text
   */
  private async extractImageText(file: File): Promise<string> {
    try {
      const { createWorker } = await import('tesseract.js');
      
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();
      
      return ret.data.text;
    } catch (error: any) {
      console.error('Error performing OCR on image:', error);
      return '[Image content - OCR failed]';
    }
  }
}

export const scraperAgent = new ScraperAgent();
