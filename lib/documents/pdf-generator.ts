import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface DocumentGeneratorData {
  wohnungsgeber: {
    name: string;
    street: string;
    zip: string;
    city: string;
  };
  owner?: {
    name?: string;
  };
  moveInDate: string; // YYYY-MM-DD
  property: {
    street: string;
    additionalInfo?: string;
    zip: string;
    city: string;
  };
  persons: Array<{
    lastName: string;
    firstName: string;
  }>;
  issueDate: string; // YYYY-MM-DD
  issuePlace?: string; // e.g. "Berlin"
}

// Format YYYY-MM-DD date string to DD.MM.YYYY
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export async function generateWohnungsgeberbestaetigung(data: DocumentGeneratorData): Promise<Uint8Array> {
  // Load the template PDF from the public/templates folder
  const templatePath = path.join(process.cwd(), 'public/templates/wohnungsgeberbestatigung.pdf');
  const templateBytes = await fs.promises.readFile(templatePath);

  // Load the PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];

  // Embed standard Helvetica font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0.06, 0.06, 0.08); // Near black (#111115)
  const fontSize = 10.5;

  // Helpers to draw text
  const drawText = (text: string, x: number, y: number, customSize = fontSize) => {
    if (!text) return;
    page.drawText(text, {
      x,
      y,
      size: customSize,
      font,
      color,
    });
  };

  // 1. Wohnungsgeber Section
  drawText(data.wohnungsgeber.name, 55, 687);
  drawText(data.wohnungsgeber.street, 55, 647);
  drawText(data.wohnungsgeber.zip, 55, 607);
  drawText(data.wohnungsgeber.city, 200, 607);

  // 2. Eigentümer Section
  if (data.owner?.name) {
    drawText(data.owner.name, 55, 527);
  }

  // 3. Move-in date line
  const formattedMoveInDate = formatDate(data.moveInDate);
  drawText(formattedMoveInDate, 350, 487);

  // 4. Property Address Section
  drawText(data.property.street, 55, 437);
  if (data.property.additionalInfo) {
    drawText(data.property.additionalInfo, 55, 397);
  }
  drawText(data.property.zip, 55, 357);
  drawText(data.property.city, 200, 357);

  // 5. Inhabitants Table (Eingezogene Personen)
  // Max rows supported is 10 based on the template design
  const startY = 300;
  const rowHeight = 21.5;
  const maxPeople = Math.min(data.persons.length, 10);

  for (let i = 0; i < maxPeople; i++) {
    const person = data.persons[i];
    const yPos = startY - i * rowHeight;
    drawText(person.lastName, 55, yPos);
    drawText(person.firstName, 310, yPos);
  }

  // 6. Date / Signature Section
  const place = data.issuePlace || 'Berlin';
  const formattedIssueDate = formatDate(data.issueDate);
  const signatureLineText = `${place}, den ${formattedIssueDate}`;
  drawText(signatureLineText, 55, 92);

  // Save and return PDF bytes
  return await pdfDoc.save();
}
