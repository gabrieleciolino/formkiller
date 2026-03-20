export const TABLE_PAGE_SIZE = 25;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function normalizePage(page: number | null | undefined) {
  if (!page || Number.isNaN(page)) return 1;
  return Math.max(1, Math.trunc(page));
}

export function getPageRange(page: number, pageSize = TABLE_PAGE_SIZE) {
  const safePage = normalizePage(page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  return { safePage, from, to };
}

export function getTotalPages(total: number, pageSize = TABLE_PAGE_SIZE) {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function buildPaginatedResult<T>({
  items,
  total,
  page,
  pageSize = TABLE_PAGE_SIZE,
}: {
  items: T[];
  total: number;
  page: number;
  pageSize?: number;
}): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: getTotalPages(total, pageSize),
  };
}
