import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@carbon/react', () => {
  const DataTableMock = (props: any) => {
    const headers = props.headers ?? [];
    const rows = (props.rows ?? []).map((row: any) => ({
      id: row.id,
      cells: headers.map((header: any) => ({
        id: `${row.id}:${header.key}`,
        value: row[header.key],
        info: { header: header.key },
      })),
    }));

    return (
      <div data-testid="data-table">
        {props.render?.({
          rows,
          headers,
          getHeaderProps: ({ header }: any = {}) => ({ id: header?.key ?? 'header' }),
          getRowProps: ({ row }: { row: any }) => ({ id: row.id }),
        })}
      </div>
    );
  };
  DataTableMock.TableContainer = ({ children }: any) => <div>{children}</div>;
  DataTableMock.Table = ({ children }: any) => <table>{children}</table>;
  DataTableMock.TableHead = ({ children }: any) => <thead>{children}</thead>;
  DataTableMock.TableRow = ({ children, id, ...rest }: any) => (
    <tr key={id} {...rest}>
      {children}
    </tr>
  );
  DataTableMock.TableHeader = ({ children, id, ...rest }: any) => (
    <th key={id} {...rest}>
      {children}
    </th>
  );
  DataTableMock.TableBody = ({ children }: any) => <tbody>{children}</tbody>;
  DataTableMock.TableCell = ({ children, id, ...rest }: any) => (
    <td key={id} {...rest}>
      {children}
    </td>
  );

  return {
    __esModule: true,
    Button: ({ children, onClick, type }: any) => (
      <button type={type ?? 'button'} onClick={onClick}>
        {children}
      </button>
    ),
    DataTable: DataTableMock,
    InlineLoading: ({ description }: any) => <div data-testid="loading">{description}</div>,
    InlineNotification: ({ title, subtitle }: any) => (
      <div data-testid="notification">{`${title}: ${subtitle}`}</div>
    ),
    Modal: ({ open, children }: any) => (open ? <div data-testid="modal">{children}</div> : null),
    Pagination: ({ onChange }: any) => (
      <button type="button" data-testid="pagination" onClick={() => onChange?.({ page: 2 })}>
        Next
      </button>
    ),
    TextInput: ({ id, labelText, value, onChange, placeholder }: any) => (
      <label htmlFor={id}>
        {labelText}
        <input
          id={id}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(event) => onChange?.(event)}
        />
      </label>
    ),
  };
});

vi.mock('@/services/rept/hooks', () => ({
  useReptUserSearch: vi.fn(),
}));

vi.mock('@/context/notification/useNotification', () => ({
  useNotification: () => ({ display: vi.fn() }),
}));

// @ts-ignore - aliased path is resolved via Vite test config
import { useReptUserSearch } from '@/services/rept/hooks';

import UserSearchModal from './index';

// @ts-ignore - aliased path is resolved via Vite test config
import type { ReptUserSearchResponse } from '@/services/rept/types';
import type { UseQueryResult } from '@tanstack/react-query';

const mockUseReptUserSearch = vi.mocked(useReptUserSearch);

const buildQueryResult = (
  override?: Partial<ReptUserSearchResponse>,
): UseQueryResult<ReptUserSearchResponse> =>
  ({
    data: {
      results: [],
      total: 0,
      page: 0,
      size: 25,
      ...override,
    } satisfies ReptUserSearchResponse,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
  }) as unknown as UseQueryResult<ReptUserSearchResponse>;

describe('UserSearchModal', () => {
  beforeEach(() => {
    mockUseReptUserSearch.mockReturnValue(buildQueryResult());
  });

  it('renders search fields', () => {
    render(<UserSearchModal open onClose={() => undefined} onSelect={() => undefined} />);

    expect(screen.getByLabelText(/user id/i)).toBeDefined();
    expect(screen.getByLabelText(/first name/i)).toBeDefined();
    expect(screen.getByLabelText(/last name/i)).toBeDefined();
  });

  it('allows selecting a user from results', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    mockUseReptUserSearch.mockReturnValue(
      buildQueryResult({
        results: [
          {
            userId: 'idir123',
            displayName: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: 'idir123@example.com',
          },
        ],
        total: 1,
      }),
    );

    render(<UserSearchModal open onClose={() => undefined} onSelect={onSelect} />);

    await user.click(await screen.findByRole('button', { name: /select/i }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'idir123', displayName: 'Test User' }),
    );
  });
});
