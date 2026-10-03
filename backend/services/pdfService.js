const path = require('path');
const { pathToFileURL } = require('url');
const { HttpError } = require('../middleware/httpError');

let pdfjsPromise;

function loadPdfjs() {
  if (!pdfjsPromise) pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsPromise;
}

function standardFontUrl() {
  const fontsDir = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts', path.sep);
  return pathToFileURL(fontsDir).href;
}

function itemsToText(items) {
  const rows = [];
  items.forEach((item) => {
    if (!item || !item.str) return;
    const y = Array.isArray(item.transform) ? Math.round(item.transform[5]) : null;
    const previous = rows[rows.length - 1];
    if (previous && y !== null && Math.abs(previous.y - y) <= 2) {
      previous.text += item.str;
      return;
    }
    if (previous && y === null) {
      previous.text += item.hasEOL ? `\n${item.str}` : ` ${item.str}`;
      return;
    }
    rows.push({ y: y === null ? rows.length * -1 : y, text: item.str });
  });
  return rows.map((row) => row.text.replace(/[ \t]+/g, ' ').trimEnd()).join('\n');
}

async function extractPdfText(buffer) {
  try {
    const pdfjs = await loadPdfjs();
    const document = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      standardFontDataUrl: standardFontUrl(),
      useSystemFonts: true,
    }).promise;

    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(itemsToText(content.items));
    }
    return pages.join('\n').replace(/\u0000/g, '').trim();
  } catch (error) {
    console.warn(error.message || error);
    throw new HttpError(400, 'Could not read this PDF. Export it again as a text-based PDF and retry.');
  }
}

module.exports = { extractPdfText };
