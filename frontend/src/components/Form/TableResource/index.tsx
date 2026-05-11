import {
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';

import EmptySection from '@/components/core/EmptySection';

import { type TableHeaderType, type PageableResponse, renderCell } from './types';

/**
 * Pagination parameters for page change events.
 * @typedef {Object} PaginationParams
 * @property {number} page - The current page number (zero-based).
 * @property {number} pageSize - The number of items per page.
 */
type PaginationParams = {
  page: number;
  pageSize: number;
};

/**
 * Props for the TableResource component.
 *
 * @template T
 * @property {TableHeaderType<T>[]} headers - Array of column definitions, including custom renderers and selection flags.
 * @property {PageableResponse<T>} content - Paginated data to display in the table.
 * @property {boolean} loading - Whether the table is in a loading state.
 * @property {boolean} error - Whether an error occurred while fetching data.
 * @property {boolean} [displayRange] - If true, shows the item range in the pagination component.
 * @property {(params: PaginationParams) => void} [onPageChange] - Callback for handling page changes.
 */
type TableResourceProps<T> = {
  headers: TableHeaderType<T, keyof T>[];
  content: PageableResponse<T>;
  loading: boolean;
  error: boolean;
  displayRange?: boolean;
  onPageChange?: (params: PaginationParams) => void;
};

/**
 * TableResource is a generic, reusable table for displaying paginated data with optional loading, error, and empty states.
 * It supports custom column rendering and integrates with Carbon's DataTable and Pagination components.
 *
 * @template T
 * @param {TableResourceProps<T>} props - The props for the component.
 * @returns {JSX.Element} The rendered TableResource component.
 */
const TableResource = <T,>({
  headers,
  content,
  loading,
  error,
  displayRange,
  onPageChange,
}: TableResourceProps<T>) => {
  if (loading)
    return (
      <DataTableSkeleton
        className="default-table-skeleton"
        aria-label="loading table data"
        headers={headers
          .filter((header) => header.selected)
          .map((header) => header as { header: string })}
        rowCount={content.page?.size || 10}
        showToolbar={false}
        showHeader={false}
        zebra={true}
      />
    );

  if (!content || !content.content)
    return (
      <EmptySection
        className="initial-empty-section"
        pictogram="Summit"
        title={error ? 'Something went wrong!' : 'Nothing to show yet!'}
        description={
          error
            ? 'Error occured while searching for results.'
            : 'Enter at least one criteria to start the search. The list will display here.'
        }
      />
    );

  if (content?.page?.totalElements === 0) {
    return (
      <EmptySection
        className="table-empty-section"
        pictogram="UserSearch"
        title="No results"
        description="Consider adjusting your search term(s) and try again."
      />
    );
  }

  const itemRangeText = (min: number, max: number, total: number) =>
    `${min}-${max} of ${total} items`;

  const noItemRangeText = () => '';

  return (
    <>
      <Table useZebraStyles>
        <TableHead>
          <TableRow>
            {headers
              .filter((header) => header.selected)
              .map((header) => (
                <TableHeader key={`header-${String(header.key)}`}>{header.header}</TableHeader>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {content.content.map((row) => (
            <TableRow key={row.id}>
              {headers
                .filter((header) => header.selected)
                .map((header) => (
                  <TableCell key={`cell-${row.id}-${String(header.key)}`}>
                    {renderCell(row, header)}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {onPageChange && (
        <Pagination
          page={content.page.number + 1}
          pageSize={content.page.size}
          pageSizes={[10, 20, 30]}
          totalItems={content.page.totalElements}
          onChange={({ page, pageSize }) => onPageChange({ page: page - 1, pageSize })}
          itemRangeText={displayRange ? itemRangeText : noItemRangeText}
        />
      )}
    </>
  );
};

export default TableResource;
