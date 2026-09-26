/**
 * Minimal RFC 4180 CSV parser: quoted fields, escaped quotes (""), CRLF/LF, a UTF-8 BOM,
 * and either "," or ";" as separator (Excel in French/Arabic locales exports ";").
 * @param {string} text
 * @returns {string[][]} rows of cells (blank lines dropped)
 */
export function parseCsv(text) {
  const BOM = String.fromCharCode(0xfeff);
  const src = text.startsWith(BOM) ? text.slice(1) : text;
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const sep =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
