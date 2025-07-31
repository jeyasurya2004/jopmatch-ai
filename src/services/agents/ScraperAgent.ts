// No static imports needed since we're using dynamic imports

export class ScraperAgent {
  /**
   * Extracts text content from a resume file using appropriate parsing library based on file type
   * @param file - The resume file to parse
   * @returns Promise resolving to the extracted text content
   */
  async extractTextContent(file: File): Promise<string> {
    try {
      // Determine the file type and use appropriate parser
      if (file.type === 'application/pdf') {
        return await this.extractPdfText(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractDocxText(file);
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
      // Dynamically import PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // For browser usage, we need to import the worker module
      await import('pdfjs-dist/build/pdf.worker.mjs');
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract text from all pages
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
   * Extracts text from a DOCX file
   * @param file - The DOCX file to parse
   * @returns Promise resolving to the extracted text
   */
  private async extractDocxText(file: File): Promise<string> {
    try {
      // Dynamically import docx4js
      const docx4js = await import('docx4js');
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load and parse the DOCX file
      const docx = await docx4js.load(arrayBuffer);
      
      // Extract text content
      let fullText = '';
      
      // Traverse the document structure to extract text
      if (docx.document && docx.document.body) {
        fullText = this.extractTextFromDocxElement(docx.document.body);
      }
      
      return fullText;
    } catch (error: any) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }
  
  /**
   * Extracts text from an image file using OCR
   * @param file - The image file to parse
   * @returns Promise resolving to the extracted text
   */
  private async extractImageText(file: File): Promise<string> {
    try {
      // Dynamically import Tesseract.js
      const { createWorker } = await import('tesseract.js');
      
      // Create a worker for OCR
      const worker = await createWorker('eng');
      
      // Perform OCR on the image
      const ret = await worker.recognize(file);
      
      // Terminate the worker
      await worker.terminate();
      
      // Return the extracted text
      return ret.data.text;
    } catch (error: any) {
      console.error('Error performing OCR on image:', error);
      // Return a placeholder if OCR fails
      return '[Image content - OCR failed]';
    }
  }
  
  /**
   * Helper method to recursively extract text from DOCX elements
   * @param element - The DOCX element to extract text from
   * @returns The extracted text
   */
  private extractTextFromDocxElement(element: any): string {
    let text = '';
    
    if (element.text) {
      text += element.text;
    }
    
    if (element.paragraphs) {
      element.paragraphs.forEach((p: any) => {
        text += this.extractTextFromDocxElement(p) + '\n';
      });
    }
    
    if (element.runs) {
      element.runs.forEach((r: any) => {
        text += this.extractTextFromDocxElement(r);
      });
    }
    
    if (element.children) {
      element.children.forEach((child: any) => {
        text += this.extractTextFromDocxElement(child);
      });
    }
    
    return text;
  }
}

export const scraperAgent = new ScraperAgent();
