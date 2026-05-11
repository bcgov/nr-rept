export type TableHeaderType<T, K extends keyof T = keyof T> = {
  key: K;
  header: string;
  selected?: boolean;
  sortable?: boolean;
  // renderAs function should expect as argument the value of the key in T
  // and return a React node to be rendered in the table cell
  // This is useful for custom rendering, like in the StatusTag component
  // where it receives a value of type { code: string; name: string }
  // Example: renderAs: (value) => <StatusTag value={value} />
  // If not provided, the default rendering will be used (value.toString())
  renderAs?: (value: T[K]) => React.ReactNode;
};

export type PaginationOnChangeType = {
  page: number;
  pageSize: number;
  ref?: React.RefObject<unknown>;
};

export type IdentifiableContent<T> = { id: string | number } & T;

export type PageType = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

export type PageableResponse<T> = {
  content: IdentifiableContent<T>[];
  page: PageType;
};

export type SortDirectionType = 'ASC' | 'DESC' | 'NONE';

export const renderCell = <T, K extends keyof T>(
  row: T,
  header: TableHeaderType<T, K>,
): React.ReactNode => {
  const value = row[header.key];
  return header.renderAs ? header.renderAs(value) : String(value);
};
