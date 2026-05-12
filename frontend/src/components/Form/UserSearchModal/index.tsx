import {
  Button,
  DataTable,
  InlineLoading,
  Pagination,
  TextInput,
  type DataTableHeader,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import { useReptUserSearch } from '@/services/rept/hooks';

import type { ReptUserSearchParams, ReptUserSummary } from '@/services/rept/types';

import './user-search-modal.scss';

type UserSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (user: ReptUserSummary) => void;
  pageSize?: number;
};

const headers: DataTableHeader[] = [
  { key: 'userId', header: 'User ID' },
  { key: 'displayName', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'actions', header: 'Actions' },
];

export const UserSearchModal = ({
  open,
  onClose,
  onSelect,
  pageSize = 25,
}: UserSearchModalProps) => {
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submittedFilters, setSubmittedFilters] = useState<ReptUserSearchParams | null>(null);
  const [page, setPage] = useState(0);

  const queryParams = useMemo<ReptUserSearchParams | null>(() => {
    if (!submittedFilters) {
      return null;
    }
    return {
      ...submittedFilters,
      page,
      size: pageSize,
    } satisfies ReptUserSearchParams;
  }, [submittedFilters, page, pageSize]);

  const searchQuery = useReptUserSearch(queryParams);
  const { display } = useNotification();

  useEffect(() => {
    if (searchQuery.isError) {
      display({
        kind: 'error',
        title: 'User search failed',
        subtitle: searchQuery.error?.message ?? 'Unable to search for users.',
        timeout: 9000,
      });
    }
  }, [searchQuery.isError, searchQuery.error, display]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setUserId('');
    setFirstName('');
    setLastName('');
    setSubmittedFilters(null);
    setPage(0);
  }, [open]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const normalizedUserId = userId.trim();
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();

      if (!normalizedUserId && !normalizedFirstName && !normalizedLastName) {
        setSubmittedFilters(null);
        return;
      }

      setSubmittedFilters({
        userId: normalizedUserId || undefined,
        firstName: normalizedFirstName || undefined,
        lastName: normalizedLastName || undefined,
      });
      setPage(0);
    },
    [userId, firstName, lastName],
  );

  const handlePageChange = useCallback(({ page: nextPage }: { page: number }) => {
    setPage(Math.max(nextPage - 1, 0));
  }, []);

  const handleSelect = useCallback(
    (user: ReptUserSummary) => {
      onSelect(user);
      onClose();
    },
    [onSelect, onClose],
  );

  const rows = useMemo(() => {
    const users: ReptUserSummary[] = searchQuery.data?.results ?? [];
    return users.map((user: ReptUserSummary) => ({
      id: user.userId,
      user,
      userId: user.userId,
      displayName: user.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email: user.email ?? '',
    }));
  }, [searchQuery.data?.results]);

  const totalResults = searchQuery.data?.total ?? 0;
  const currentPage = page + 1;
  const shouldShowPagination = submittedFilters !== null && totalResults > pageSize;

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading="Find user"
      passiveModal
      size="lg"
      className="add-contact-modal"
    >
      <form className="user-search-form" onSubmit={handleSubmit}>
        <div className="user-search-form__fields">
          <TextInput
            id="user-search-user-id"
            labelText="User ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
          <TextInput
            id="user-search-first-name"
            labelText="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <TextInput
            id="user-search-last-name"
            labelText="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
          <Button type="submit" size="md" className="user-search-form__submit">
            Search
          </Button>
        </div>
      </form>

      {searchQuery.isFetching && (
        <div className="user-search-form__loading">
          <InlineLoading description="Searching users…" />
        </div>
      )}

      {!searchQuery.isFetching && rows.length === 0 && submittedFilters !== null && (
        <p className="user-search-form__empty">No users matched your search.</p>
      )}

      {rows.length > 0 && (
        <DataTable
          rows={rows}
          headers={headers}
          size="sm"
          render={({ rows: tableRows, headers: tableHeaders, getHeaderProps, getRowProps }) => (
            <DataTable.TableContainer>
              <DataTable.Table>
                <DataTable.TableHead>
                  <DataTable.TableRow>
                    {tableHeaders.map((header) => (
                      <DataTable.TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </DataTable.TableHeader>
                    ))}
                  </DataTable.TableRow>
                </DataTable.TableHead>
                <DataTable.TableBody>
                  {tableRows.map((row) => (
                    <DataTable.TableRow {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <DataTable.TableCell key={cell.id}>
                          {cell.info.header === 'actions'
                            ? (() => {
                                const selected = rows.find(
                                  (candidate: (typeof rows)[number]) => candidate.id === row.id,
                                )?.user;
                                if (!selected) {
                                  return '—';
                                }
                                return (
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    onClick={() => handleSelect(selected)}
                                  >
                                    Select
                                  </Button>
                                );
                              })()
                            : cell.value || '—'}
                        </DataTable.TableCell>
                      ))}
                    </DataTable.TableRow>
                  ))}
                </DataTable.TableBody>
              </DataTable.Table>
            </DataTable.TableContainer>
          )}
        />
      )}

      {shouldShowPagination && (
        <div className="user-search-form__pagination">
          <Pagination
            totalItems={totalResults}
            pageSize={pageSize}
            page={currentPage}
            onChange={handlePageChange}
            pageSizes={[pageSize]}
            size="sm"
            backwardText="Previous"
            forwardText="Next"
          />
        </div>
      )}

      <div className="add-contact-modal__actions">
        <Button kind="secondary" size="md" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default UserSearchModal;
