const { PDFDocument, StandardFonts } = require('pdf-lib');

function wrapLine(text, width = 92) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

async function buildTextPdf(paragraphs) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = [];
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) lines.push('');
    wrapLine(paragraph).forEach((line) => lines.push(line));
  });

  let page = doc.addPage([612, 792]);
  let y = 750;
  lines.forEach((line) => {
    if (y < 48) {
      page = doc.addPage([612, 792]);
      y = 750;
    }
    if (line) page.drawText(line, { x: 48, y, size: 10, font });
    y -= 14;
  });

  return Buffer.from(await doc.save({ useObjectStreams: false, addDefaultPage: false }));
}

module.exports = { buildTextPdf };
