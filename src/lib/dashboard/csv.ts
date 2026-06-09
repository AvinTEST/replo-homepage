const FORMULA_PREFIX = /^[=+\-@]/;

export function neutralizeCsvFormula(value: string | number) {
  const text = String(value ?? "");
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

export function escapeCsvCell(value: string | number) {
  return `"${neutralizeCsvFormula(value).replaceAll('"', '""')}"`;
}

export function createCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}
