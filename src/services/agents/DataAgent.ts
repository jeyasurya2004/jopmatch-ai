import { groqService } from '../groq';

export class DataAgent {
  async extractResumeData(file: File | string): Promise<any> {
    try {
      console.log('DataAgent: Starting resume extraction');
      
      // Check if input is a string (from ScraperAgent)
      if (typeof file === 'string') {
        const extractedData = await groqService.extractResumeData(file, 'text', false);
        return this.processExtractedData(extractedData);
      }
      
      // Handle File objects (from ResumeUpload)
      console.log('DataAgent: Starting resume extraction for file:', file.name);
      
      if (file.type.includes('image') || file.type === 'application/pdf') {
        // Handle image/PDF files
        let base64Data: string;
        
        // Check if this is a mock File with pre-encoded base64 data
        if ((file as any).isMockFile) {
          base64Data = (file as any).base64Data;
        } else {
          base64Data = await this.fileToBase64(file);
        }
        
        const extractedData = await groqService.extractResumeData(base64Data, file.type, true);
        return this.processExtractedData(extractedData);
      } else {
        // Handle text files
        let fileContent: string;
        
        // Check if this is a mock File with pre-loaded content
        if ((file as any).isMockFile) {
          fileContent = (file as any).content;
        } else {
          fileContent = await this.fileToString(file);
        }
        
        const extractedData = await groqService.extractResumeData(fileContent, 'text', false);
        return this.processExtractedData(extractedData);
      }
      
    } catch (error) {
      console.error('DataAgent: Error extracting resume data:', error);
      throw error;
    }
  }

  private processExtractedData(extractedData: string): any {
    try {
      console.log('DataAgent: Raw extraction result:', extractedData);
      
      // Clean and parse JSON response
      const cleanedData = this.cleanJsonResponse(extractedData);
      console.log('DataAgent: Cleaned data:', cleanedData);
      
      const parsedData = JSON.parse(cleanedData);
      console.log('DataAgent: Parsed data:', parsedData);
      
      // Check if parsedData has the expected structure
      if (parsedData.contact) {
        // New structure from GroqService
        const resumeData = {
          name: parsedData.contact.name || 'Unknown',
          email: parsedData.contact.email || '',
          phone: parsedData.contact.phone || '',
          skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
          education: Array.isArray(parsedData.education) ? parsedData.education : [],
          projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
          experience: Array.isArray(parsedData.workExperience) ? parsedData.workExperience : [],
          summary: parsedData.summary || '',
          uploadedAt: new Date(),
        };
        
        console.log('DataAgent: Final structured data (new format):', resumeData);
        return resumeData;
      } else {
        // Old structure or flat structure
        const resumeData = {
          name: parsedData.name || 'Unknown',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
          education: Array.isArray(parsedData.education) ? parsedData.education : [],
          projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
          experience: Array.isArray(parsedData.experience) ? parsedData.experience : 
                     (Array.isArray(parsedData.workExperience) ? parsedData.workExperience : []),
          summary: parsedData.summary || '',
          uploadedAt: new Date(),
        };
        
        console.log('DataAgent: Final structured data (old/flat format):', resumeData);
        return resumeData;
      }
    } catch (error) {
      console.error('DataAgent: Error processing extracted data:', error);
      throw error;
    }
  }

  private async fileToString(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          // Remove the data URL prefix to get just the base64 data
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsDataURL(file);
    });
  }

  private cleanJsonResponse(response: string): string {
    // Remove any markdown formatting or extra text
    let cleaned = response.trim();
    
    // Find JSON content between curly braces
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // Remove any trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    return cleaned;
  }
}

export const dataAgent = new DataAgent();