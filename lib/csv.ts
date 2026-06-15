/**
 * Minimal, dependency-free CSV parser (RFC 4180-ish).
 * Handles quoted fields, escaped quotes (""), commas and newlines inside
 * quotes, and both \n and \r\n line endings. Good enough for spreadsheet
 * exports from Excel / Google Sheets.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  // Strip a leading BOM if present (Excel loves to add one).
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignore — handled by the following \n (or end of input below)
    } else {
      field += c;
    }
  }

  // Flush the final field/row if the file didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty trailing rows.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Parse a CSV string into objects keyed by a normalized header
 * (lowercased, spaces/dashes -> underscores). Returns header list + records.
 */
export function parseCsvRecords(input: string): {
  headers: string[];
  records: Record<string, string>[];
} {
  const rows = parseCsv(input);
  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0].map(normalizeHeader);
  const records = rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (cells[idx] ?? "").trim();
    });
    return rec;
  });

  return { headers, records };
}

export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}
