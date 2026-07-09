export function initials(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NU';
}

export function formatDate(value: string | Date, fmt = 'yyyy/MM/dd HH:mm'): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  const map: Record<string, number> = {
    yyyy: d.getFullYear(),
    MM: d.getMonth() + 1,
    dd: d.getDate(),
    HH: d.getHours(),
    mm: d.getMinutes(),
  };
  let result = fmt;
  for (const [key, val] of Object.entries(map)) {
    result = result.replace(key, String(val).padStart(2, '0'));
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function filterBy<T extends Record<string, unknown>>(
  items: T[],
  fields: (keyof T)[],
  keyword: string,
): T[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return val != null && String(val).toLowerCase().includes(kw);
    }),
  );
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: '啟用',
    pending: '待審核',
    suspended: '停權',
    draft: '草稿',
    published: '已發布',
    closed: '已截止',
    completed: '已完成',
    registered: '已報名',
    cancelled: '已取消',
    waitlisted: '候補',
    paid: '已付款',
    unpaid: '未付款',
    refunded: '已退款',
  };
  return labels[status] ?? status;
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}
