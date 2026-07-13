import { Injectable } from '@angular/core';

export interface RegistrationExportRow {
  name: string;
  event: string;
  paymentStatus: string;
  checkIn: string;
  status: string;
}

const HEADERS = ['姓名', '活動', '付款狀態', '簽到', '報名狀態'];

@Injectable({ providedIn: 'root' })
export class RegistrationExportService {
  exportCsv(rows: RegistrationExportRow[]): void {
    const body = rows.map((row) => this.values(row).map((value) => this.csvCell(value)).join(','));
    const content = `\uFEFF${[HEADERS.join(','), ...body].join('\r\n')}`;
    this.download(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'registrations.csv');
  }

  exportExcel(rows: RegistrationExportRow[]): void {
    const head = HEADERS.map((header) => `<th>${header}</th>`).join('');
    const body = rows.map((row) => (
      `<tr>${this.values(row).map((value) => `<td>${this.html(value)}</td>`).join('')}</tr>`
    )).join('');
    const content = `<!doctype html><meta charset="utf-8"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    const type = 'application/vnd.ms-excel;charset=utf-8';
    this.download(new Blob([content], { type }), 'registrations.xls');
  }

  printPdf(rows: RegistrationExportRow[]): boolean {
    const popup = window.open('', '_blank');
    if (!popup) return false;
    popup.opener = null;
    const head = HEADERS.map((header) => `<th>${header}</th>`).join('');
    const body = rows.map((row) => (
      `<tr>${this.values(row).map((value) => `<td>${this.html(value)}</td>`).join('')}</tr>`
    )).join('');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>報名資料</title>
      <style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;text-align:left}</style>
      </head><body><h1>報名資料</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
    return true;
  }

  private values(row: RegistrationExportRow): string[] {
    return [row.name, row.event, row.paymentStatus, row.checkIn, row.status];
  }

  private csvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private html(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
