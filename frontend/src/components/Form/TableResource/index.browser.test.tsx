import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import TableResource from './index';

// Mocks for Carbon and EmptySection
vi.mock('@carbon/react', () => ({
  DataTableSkeleton: (props: any) => (
    <div data-testid="skeleton">Skeleton {props['aria-label']}</div>
  ),
  Pagination: (props: any) => (
    <button data-testid="pagination" onClick={() => props.onChange?.({ page: 2, pageSize: 20 })}>
      Pagination
    </button>
  ),
  Table: (props: any) => <table data-testid="table"> {props.children} </table>,
  TableBody: (props: any) => <tbody>{props.children}</tbody>,
  TableCell: (props: any) => <td>{props.children}</td>,
  TableHead: (props: any) => <thead>{props.children}</thead>,
  TableHeader: (props: any) => <th>{props.children}</th>,
  TableRow: (props: any) => <tr>{props.children}</tr>,
}));
vi.mock('@/components/core/EmptySection', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="empty-section">{props.title}</div>,
}));

describe('TableResource', () => {
  const headers = [
    { key: 'id', header: 'ID', selected: true },
    { key: 'name', header: 'Name', selected: true },
    { key: 'custom', header: 'Custom', selected: true, renderAs: (val: any) => `Custom: ${val}` },
    { key: 'hidden', header: 'Hidden', selected: false },
  ];
  const content = {
    content: [
      { id: 1, name: 'Alice', custom: 'A', hidden: 'x' },
      { id: 2, name: 'Bob', custom: 'B', hidden: 'y' },
    ],
    page: { number: 0, size: 10, totalElements: 2 },
  };

  it('renders skeleton when loading', () => {
    render(<TableResource headers={headers} content={content} loading={true} error={false} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders initial empty section if no content', () => {
    render(<TableResource headers={headers} content={{} as any} loading={false} error={false} />);
    expect(screen.getByTestId('empty-section')).toHaveTextContent('Nothing to show yet!');
  });

  it('renders error empty section if error and no content', () => {
    render(<TableResource headers={headers} content={{} as any} loading={false} error={true} />);
    expect(screen.getByTestId('empty-section')).toHaveTextContent('Something went wrong!');
  });

  it('renders no results empty section if totalElements is 0', () => {
    render(
      <TableResource
        headers={headers}
        content={{ content: [], page: { number: 0, size: 10, totalElements: 0 } }}
        loading={false}
        error={false}
      />,
    );
    expect(screen.getByTestId('empty-section')).toHaveTextContent('No results');
  });

  it('renders table with data and custom renderers', () => {
    render(<TableResource headers={headers} content={content} loading={false} error={false} />);
    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Custom: A')).toBeInTheDocument();
    expect(screen.getByText('Custom: B')).toBeInTheDocument();
    // Hidden column should not be rendered
    expect(screen.queryByText('x')).toBeNull();
    expect(screen.queryByText('y')).toBeNull();
  });

  it('calls onPageChange when pagination is used', () => {
    const onPageChange = vi.fn();
    render(
      <TableResource
        headers={headers}
        content={content}
        loading={false}
        error={false}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByTestId('pagination'));
    expect(onPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });
});
