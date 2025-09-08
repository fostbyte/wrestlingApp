import fs from "fs";
import pdf from "pdf-parse";

export interface ParsedCompetitionData {
  athletes: {
    name: string;
    weightClass: string;
    placement?: number;
    wins?: number;
    losses?: number;
    pins?: number;
    takedowns?: number;
  }[];
  competitionName?: string;
  date?: string;
  results?: any[];
}

export async function parsePDF(filePath: string): Promise<ParsedCompetitionData> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Basic PDF parsing - in a real implementation, this would be more sophisticated
    // and handle various PDF formats from different wrestling organizations
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const athletes: ParsedCompetitionData['athletes'] = [];
    let competitionName = '';
    let date = '';

    // Extract competition name (usually in the first few lines)
    if (lines.length > 0) {
      competitionName = lines[0].trim();
    }

    // Look for date patterns
    for (const line of lines.slice(0, 10)) {
      const dateMatch = line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}/);
      if (dateMatch) {
        date = dateMatch[0];
        break;
      }
    }

    // Parse athlete results - this is a simplified parser
    // Real implementation would need to handle various tournament formats
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for weight class indicators
      const weightMatch = line.match(/(\d{2,3})\s*lbs?/i);
      if (weightMatch) {
        const weightClass = weightMatch[1] + ' lbs';
        
        // Look for athlete names and results in subsequent lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const resultLine = lines[j];
          
          // Simple pattern matching for common wrestling result formats
          const nameMatch = resultLine.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          const placementMatch = resultLine.match(/(\d+)(st|nd|rd|th)/);
          const recordMatch = resultLine.match(/(\d+)-(\d+)/);
          const pinMatch = resultLine.match(/pin|fall/i);
          
          if (nameMatch) {
            const athleteData = {
              name: nameMatch[1],
              weightClass,
              placement: placementMatch ? parseInt(placementMatch[1]) : undefined,
              wins: recordMatch ? parseInt(recordMatch[1]) : undefined,
              losses: recordMatch ? parseInt(recordMatch[2]) : undefined,
              pins: pinMatch ? 1 : 0,
              takedowns: 0, // Would need more sophisticated parsing
            };
            
            // Avoid duplicates
            const existing = athletes.find(a => a.name === athleteData.name && a.weightClass === athleteData.weightClass);
            if (!existing) {
              athletes.push(athleteData);
            }
          }
        }
      }
    }

    // If no athletes found with weight class matching, try alternative parsing
    if (athletes.length === 0) {
      // Fallback parsing for different PDF formats
      for (const line of lines) {
        const nameMatch = line.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
        const weightMatch = line.match(/(\d{2,3})/);
        
        if (nameMatch && weightMatch) {
          athletes.push({
            name: nameMatch[1],
            weightClass: weightMatch[1] + ' lbs',
          });
        }
      }
    }

    return {
      athletes,
      competitionName: competitionName || 'Wrestling Competition',
      date: date || new Date().toISOString().split('T')[0],
      results: lines, // Store raw text for debugging
    };

  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Helper function to clean up uploaded files
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error cleaning up file:", error);
  }
}
