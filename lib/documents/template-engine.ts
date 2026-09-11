import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';

export interface TemplateFieldConfig {
  id: string;
  name: string;
  page?: number;
  x: number;
  y: number;
  width: number;
  height?: number;
  fontSize?: number;
  maxFontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  multiline?: boolean;
  maxLines?: number;
  isBold?: boolean;
  required?: boolean;
}

export interface DocumentTemplateConfig {
  id: string;
  name: string;
  pageSize: { width: number; height: number };
  fields: TemplateFieldConfig[];
}

export interface WohnungsgeberData {
  wohnungsgeber: {
    name: string;
    street: string;
    zip: string;
    city: string;
  };
  owner?: {
    name?: string;
  };
  moveInDate: string; // YYYY-MM-DD or DD.MM.YYYY
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
  issueDate: string; // YYYY-MM-DD or DD.MM.YYYY
  issuePlace?: string; // e.g. "Berlin"
}

// Format date string to DD.MM.YYYY
export function formatDateGerman(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('.')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

/**
 * Generate Wohnungsgeberbestätigung PDF with vector precision layout
 */
export async function generateWohnungsgeberPDF(data: WohnungsgeberData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Standard A4 Size: 595.28 x 841.89 points
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.05, 0.05, 0.05);
  const darkGray = rgb(0.25, 0.25, 0.25);
  const lightGray = rgb(0.96, 0.96, 0.96);
  const borderGray = rgb(0.1, 0.1, 0.1);

  const marginX = 40;
  const contentWidth = 515.28;

  function drawText(text: string, x: number, y: number, size = 9, isBold = false, color = darkGray) {
    if (!text) return;
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? fontBold : font,
      color,
    });
  }

  function drawBox(x: number, y: number, width: number, height: number, bg: any = null) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: borderGray,
      borderWidth: 0.8,
      color: bg || undefined,
    });
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number, width = 0.8) {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: width,
      color: borderGray,
    });
  }

  // Draw field with text auto-scaling & wrapping within boundaries
  function drawValueField(text: string, x: number, y: number, width: number, fontSize = 9.5, isBold = false, multiline = false) {
    if (!text) return;
    const selectedFont: PDFFont = isBold ? fontBold : font;
    let currentFontSize = fontSize;

    if (!multiline) {
      let textWidth = selectedFont.widthOfTextAtSize(text, currentFontSize);
      while (textWidth > width && currentFontSize > 6.5) {
        currentFontSize -= 0.5;
        textWidth = selectedFont.widthOfTextAtSize(text, currentFontSize);
      }
      if (textWidth > width) {
        let truncated = text;
        while (truncated.length > 3 && selectedFont.widthOfTextAtSize(truncated + '...', currentFontSize) > width) {
          truncated = truncated.slice(0, -1);
        }
        text = truncated + '...';
      }
      page.drawText(text, {
        x,
        y,
        size: currentFontSize,
        font: selectedFont,
        color: black,
      });
    } else {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = selectedFont.widthOfTextAtSize(testLine, currentFontSize);
        if (testWidth <= width) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      const visibleLines = lines.slice(0, 2);
      visibleLines.forEach((lineText, idx) => {
        const lineY = y - idx * (currentFontSize * 1.15);
        page.drawText(lineText, {
          x,
          y: lineY,
          size: currentFontSize,
          font: selectedFont,
          color: black,
        });
      });
    }
  }

  // ----------------------------------------------------
  // 1. HEADER
  // ----------------------------------------------------
  drawText('Wohnungsgeberbestätigung gemäß § 19 Abs. 3 Bundesmeldegesetz (BMG)', marginX, 800, 12.5, true, black);
  drawText('- zur Vorlage bei der Meldebehörde -', marginX, 784, 9.5, false, darkGray);

  // ----------------------------------------------------
  // 2. SECTION 1: Wohnungsgeber
  // ----------------------------------------------------
  drawText('1. Angaben zum Wohnungsgeber (oder der beauftragten Person):', marginX, 760, 10, true, black);

  const box1Y = 672;
  const box1Height = 80;
  drawBox(marginX, box1Y, contentWidth, box1Height);
  drawLine(marginX, 725, marginX + contentWidth, 725);
  drawLine(marginX, 698, marginX + contentWidth, 698);
  drawLine(marginX + 120, 672, marginX + 120, 698);

  drawText('Familienname, Vorname bzw. Bezeichnung der juristischen Person:', marginX + 6, 742, 7.5, false, darkGray);
  drawText('Straße, Haus-Nr.:', marginX + 6, 715, 7.5, false, darkGray);
  drawText('PLZ:', marginX + 6, 688, 7.5, false, darkGray);
  drawText('Ort:', marginX + 126, 688, 7.5, false, darkGray);

  // ----------------------------------------------------
  // 3. SECTION 2: Eigentümer
  // ----------------------------------------------------
  drawText('2. Angaben zum Eigentümer der Wohnung:', marginX, 656, 10, true, black);
  drawText('(nur auszufüllen, wenn dieser nicht selbst Wohnungsgeber ist)', marginX + 225, 656, 7.5, false, darkGray);

  const box2Y = 612;
  const box2Height = 36;
  drawBox(marginX, box2Y, contentWidth, box2Height);
  drawText('Familienname, Vorname bzw. Bezeichnung der juristischen Person:', marginX + 6, 638, 7.5, false, darkGray);

  // ----------------------------------------------------
  // 4. SECTION 3: Einzugsdatum
  // ----------------------------------------------------
  const box3Y = 572;
  drawText('3. Hiermit wird ein Einzug in die nachstehende Wohnung bestätigt am:', marginX, box3Y + 6, 10, true, black);
  drawBox(marginX + 370, box3Y, 140, 22, lightGray);

  // ----------------------------------------------------
  // 5. SECTION 4: Wohnung
  // ----------------------------------------------------
  drawText('4. Anschrift der Wohnung:', marginX, 552, 10, true, black);

  const box4Y = 465;
  const box4Height = 80;
  drawBox(marginX, box4Y, contentWidth, box4Height);
  drawLine(marginX, 518, marginX + contentWidth, 518);
  drawLine(marginX, 491, marginX + contentWidth, 491);
  drawLine(marginX + 120, 465, marginX + 120, 491);

  drawText('Straße, Haus-Nr.:', marginX + 6, 535, 7.5, false, darkGray);
  drawText('Zusatzangaben (z. B. Stockwerk, Wohnungsnummer, C/O):', marginX + 6, 508, 7.5, false, darkGray);
  drawText('PLZ:', marginX + 6, 481, 7.5, false, darkGray);
  drawText('Ort:', marginX + 126, 481, 7.5, false, darkGray);

  // ----------------------------------------------------
  // 6. SECTION 5: Eingezogene Personen Table
  // ----------------------------------------------------
  drawText('5. Folgende Person/en ist/sind in die angegebene Wohnung eingezogen:', marginX, 448, 10, true, black);

  const tableY = 240;
  const tableHeight = 195;
  const colWidth = contentWidth / 2;
  drawBox(marginX, tableY, contentWidth, tableHeight);

  drawLine(marginX + colWidth, tableY, marginX + colWidth, tableY + tableHeight);
  drawLine(marginX, tableY + tableHeight - 24, marginX + contentWidth, tableY + tableHeight - 24);

  page.drawRectangle({
    x: marginX + 0.8,
    y: tableY + tableHeight - 23.2,
    width: contentWidth - 1.6,
    height: 22.4,
    color: lightGray,
  });
  drawText('Familienname', marginX + 10, tableY + tableHeight - 16, 9, true, black);
  drawText('Vornamen', marginX + colWidth + 10, tableY + tableHeight - 16, 9, true, black);

  const rowHeight = 24.4;
  for (let r = 1; r <= 6; r++) {
    const rowY = tableY + tableHeight - 24 - r * rowHeight;
    drawLine(marginX, rowY, marginX + contentWidth, rowY);
  }

  // ----------------------------------------------------
  // 7. SECTION 6: Datum, Ort & Unterschrift
  // ----------------------------------------------------
  const sigY = 160;
  drawLine(marginX, sigY, marginX + 220, sigY);
  drawLine(marginX + 270, sigY, marginX + contentWidth, sigY);
  drawText('Ort, Datum', marginX, sigY - 12, 8, false, darkGray);
  drawText('Unterschrift des Wohnungsgebers / Vermieters', marginX + 270, sigY - 12, 8, false, darkGray);

  // ----------------------------------------------------
  // 8. SECTION 7: Legal Disclaimer Footer
  // ----------------------------------------------------
  const footerY = 90;
  page.drawRectangle({
    x: marginX,
    y: footerY - 40,
    width: contentWidth,
    height: 60,
    color: lightGray,
    borderColor: borderGray,
    borderWidth: 0.5,
  });
  drawText('Hinweis gemäß § 19 Abs. 6 BMG:', marginX + 8, footerY + 8, 7.5, true, black);
  drawText('Es ist verboten, eine Wohnanschrift einem Dritten zur Anmeldung anzubieten oder zur Verfügung zu stellen, obwohl ein', marginX + 8, footerY - 4, 7, false, darkGray);
  drawText('tatsächlicher Bezug der Wohnung durch diesen weder stattfindet noch beabsichtigt ist. Ein Verstoß gegen dieses Verbot stellt', marginX + 8, footerY - 15, 7, false, darkGray);
  drawText('eine Ordnungswidrigkeit dar (§ 54 Abs. 1 BMG) und kann mit einer Geldbuße bis zu 50.000 Euro geahndet werden.', marginX + 8, footerY - 26, 7, false, darkGray);

  // ----------------------------------------------------
  // FILL DYNAMIC USER DATA
  // ----------------------------------------------------
  const moveInDateFormatted = formatDateGerman(data.moveInDate);
  const issueDateFormatted = formatDateGerman(data.issueDate);
  const place = data.issuePlace || 'Berlin';

  drawValueField(data.wohnungsgeber.name, marginX + 6, 730, contentWidth - 12, 9.5, true);
  drawValueField(data.wohnungsgeber.street, marginX + 6, 703, contentWidth - 12, 9.5);
  drawValueField(data.wohnungsgeber.zip, marginX + 6, 676, 108, 9.5);
  drawValueField(data.wohnungsgeber.city, marginX + 126, 676, contentWidth - 132, 9.5);

  if (data.owner?.name) {
    drawValueField(data.owner.name, marginX + 6, 616, contentWidth - 12, 9.5);
  }

  // Move in date in highlighted box
  drawValueField(moveInDateFormatted, marginX + 380, box3Y + 6, 120, 11, true);

  // Property address
  drawValueField(data.property.street, marginX + 6, 523, contentWidth - 12, 9.5);
  drawValueField(data.property.additionalInfo || '', marginX + 6, 496, contentWidth - 12, 9.5);
  drawValueField(data.property.zip, marginX + 6, 469, 108, 9.5);
  drawValueField(data.property.city, marginX + 126, 469, contentWidth - 132, 9.5);

  // Inhabitants Table Rows
  const maxPersons = Math.min(data.persons.length, 7);
  for (let idx = 0; idx < maxPersons; idx++) {
    const person = data.persons[idx];
    const rowTextY = tableY + tableHeight - 24 - (idx + 1) * rowHeight + 8;
    drawValueField(person.lastName, marginX + 10, rowTextY, colWidth - 20, 9.5);
    drawValueField(person.firstName, marginX + colWidth + 10, rowTextY, colWidth - 20, 9.5);
  }

  // Date and place signature
  drawValueField(`${place}, den ${issueDateFormatted}`, marginX, sigY + 6, 220, 9.5);

  return await pdfDoc.save();
}
