/**
 * Robust CSV parser and serializer utility
 * Handles quoted fields, escaped quotes, multiline values, BOM headers, and diverse line endings.
 */

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  totalRawRows: number;
}

export function parseCSV(rawText: string): ParsedCSV {
  if (!rawText || !rawText.trim()) {
    return { headers: [], rows: [], totalRawRows: 0 };
  }

  // Strip BOM if present
  let cleanText = rawText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = splitCSVLines(cleanText);
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRawRows: 0 };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) => h.trim()).filter((h) => h.length > 0);

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(lines[i]);
    const rowObj: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index].trim() : '';
    });

    rows.push(rowObj);
  }

  return {
    headers,
    rows,
    totalRawRows: rows.length,
  };
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue);
  return values;
}

export function exportToCSV(filename: string, headers: string[], rows: Record<string, any>[]): void {
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(escapeCSVField).join(','));

  // Data rows
  for (const row of rows) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      return escapeCSVField(String(val));
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSVField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
