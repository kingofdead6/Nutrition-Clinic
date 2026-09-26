/**
 * Opens a print view in a new tab and asks it to print itself once its data is loaded.
 * (In the desktop build this maps to Electron's webContents.print()/printToPDF().)
 */
export function openPrint(path: string) {
  const url = `${path}${path.includes('?') ? '&' : '?'}autoprint=1`;
  window.open(url, '_blank', 'noopener');
}
