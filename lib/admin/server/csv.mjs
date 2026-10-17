/**
 * Escapes a single CSV field following RFC 4180.
 * Protects against CSV formula injection (=, +, -, @, \t, \r) in spreadsheet software.
 */
export function escapeCsvField(val) {
  if (val == null) return "";
  let str = String(val);

  // Defend against CSV injection in Excel/Sheets/Calc
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If contains delimiter, quote, or newline, escape quotes and wrap in quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
