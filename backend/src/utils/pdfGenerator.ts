export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // Use puppeteer for PDF generation when available
  // Falls back to a simple buffer for environments without puppeteer
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch {
    // Fallback: return HTML as buffer if puppeteer is not available
    return Buffer.from(html, 'utf-8');
  }
}

export function renderReportHtml(title: string, rows: Record<string, unknown>[], columns: string[]): string {
  const headerCells = columns.map((col) => `<th style="border:1px solid #ddd;padding:8px;background:#4f46e5;color:white;">${col}</th>`).join('');
  const bodyRows = rows
    .map((row) => {
      const cells = columns.map((col) => `<td style="border:1px solid #ddd;padding:8px;">${row[col] ?? ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { color: #4f46e5; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { text-align: left; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .meta { color: #64748b; font-size: 14px; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>
  `;
}
