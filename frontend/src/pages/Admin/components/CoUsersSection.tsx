import { AddAlt as Add, Edit, TrashCan } from '@carbon/icons-react';
import { Button, IconButton, Select, SelectItem, Stack, TextInput, Toggle } from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import DestructiveModal from '@/components/core/DestructiveModal';
import TableResource from '@/components/Form/TableResource';
import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import useDebounce from '@/hooks/useDebounce';
import { useCoUserMutations, useCoUserSearch } from '@/services/rept/admin/hooks';

import OrgUnitSelector from './OrgUnitSelector';
import { describeOrgUnit, paginateRows, safeRevisionCount } from './sectionUtils';

import type { IdentifiableContent, TableHeaderType } from '@/components/Form/TableResource/types';
import type {
  CoUserDto,
  CoUserRequest,
  CoUserSearch,
  OrgUnitSearchResult,
} from '@/services/rept/admin/types';

type CoUserRow = IdentifiableContent<{
  name: string;
  type: string;
  orgUnit: string;
  record: CoUserDto;
}>;

type CoUserFormState = {
  id?: number;
  name: string;
  external: boolean;
  orgUnit: OrgUnitSearchResult | null;
  revisionCount: number | null;
};

const CoUsersSection: FC = () => {
  const { display } = useNotification();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'external'>('all');
  const debouncedQuery = useDebounce(searchText, 300);
  const [tablePage, setTablePage] = useState(0);
  const [tableSize, setTableSize] = useState(10);

  const criteria: CoUserSearch = useMemo(
    () => ({
      query: debouncedQuery,
      external: typeFilter === 'all' ? undefined : typeFilter === 'external',
    }),
    [debouncedQuery, typeFilter],
  );

  const listQuery = useCoUserSearch(criteria);
  const mutations = useCoUserMutations(criteria);

  useEffect(() => {
    if (listQuery.isError) {
      display({
        kind: 'error',
        title: 'Unable to load co-users',
        subtitle: (listQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [listQuery.isError, listQuery.error, display]);

  const [formState, setFormState] = useState<CoUserFormState>({
    id: undefined,
    name: '',
    external: false,
    orgUnit: null,
    revisionCount: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<CoUserDto | null>(null);

  const showError = useCallback(
    (subtitle: string) => {
      display({ kind: 'error', title: 'Co-user error', subtitle, timeout: 6000 });
    },
    [display],
  );

  const showSuccess = useCallback(
    (title: string) => {
      display({ kind: 'success', title, timeout: 4000 });
    },
    [display],
  );

  const resetForm = useCallback(() => {
    setFormState({ id: undefined, name: '', external: false, orgUnit: null, revisionCount: null });
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((record: CoUserDto) => {
    setFormState({
      id: record.id,
      name: record.name,
      external: record.external,
      orgUnit: record.orgUnit ?? null,
      revisionCount: record.revisionCount ?? null,
    });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async () => {
    // Validation based on external/internal type
    if (formState.external) {
      const trimmed = formState.name.trim();
      if (!trimmed) {
        showError('Name is required for external co-users');
        return;
      }
      if (!formState.id) {
        const exists = (listQuery.data ?? []).some(
          (item) => item.external && item.name?.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) {
          showError('An external co-user with this name already exists');
          return;
        }
      }
    } else {
      if (!formState.orgUnit) {
        showError('Organizational unit is required for internal co-users');
        return;
      }
      if (!formState.id) {
        const exists = (listQuery.data ?? []).some(
          (item) => !item.external && item.orgUnit?.number === formState.orgUnit?.number,
        );
        if (exists) {
          showError('A co-user already exists for this organizational unit');
          return;
        }
      }
    }

    const payload: CoUserRequest = {
      name: formState.external ? formState.name.trim() : null,
      external: formState.external,
      orgUnitNumber: formState.external ? null : (formState.orgUnit?.number ?? null),
      revisionCount: formState.id ? safeRevisionCount(formState.revisionCount) : undefined,
    };

    try {
      if (formState.id) {
        await mutations.update.mutateAsync({ id: formState.id, payload });
        showSuccess('Co-user updated');
      } else {
        await mutations.create.mutateAsync(payload);
        showSuccess('Co-user created');
      }
      closeModal();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const openDeleteConfirm = useCallback((record: CoUserDto) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!recordToDelete?.id) {
      return;
    }
    try {
      await mutations.remove.mutateAsync({
        id: recordToDelete.id,
        revisionCount: safeRevisionCount(recordToDelete.revisionCount ?? null),
      });
      showSuccess('Co-user removed');
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const rows = useMemo<CoUserRow[]>(
    () =>
      (listQuery.data ?? []).map((record) => ({
        id: record.id,
        name: record.name,
        type: record.external ? 'External' : 'Internal',
        orgUnit: describeOrgUnit(record.orgUnit),
        record,
      })),
    [listQuery.data],
  );
  const isBusy =
    mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;

  const tableHeaders: TableHeaderType<CoUserRow>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', selected: true },
      { key: 'type', header: 'Type', selected: true },
      { key: 'orgUnit', header: 'Org unit', selected: true },
      {
        key: 'record',
        header: 'Actions',
        selected: true,
        renderAs: (value) => {
          const record = value as CoUserDto;
          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <IconButton
                kind="ghost"
                size="sm"
                label={`Edit ${record.name}`}
                onClick={() => openEditModal(record)}
              >
                <Edit />
              </IconButton>
              <IconButton
                kind="ghost"
                size="sm"
                label={`Delete ${record.name}`}
                onClick={() => openDeleteConfirm(record)}
              >
                <TrashCan />
              </IconButton>
            </div>
          );
        },
      },
    ],
    [openEditModal, openDeleteConfirm],
  );

  const tableContent = useMemo(
    () => paginateRows(rows, tablePage, tableSize),
    [rows, tablePage, tableSize],
  );

  const handlePageChange = useCallback(({ page, pageSize }: { page: number; pageSize: number }) => {
    setTablePage(page);
    setTableSize(pageSize);
  }, []);

  useEffect(() => {
    setTablePage(0);
  }, [criteria]);

  useEffect(() => {
    const total = rows.length;
    if (tablePage > 0 && tablePage * tableSize >= total) {
      setTablePage(0);
    }
  }, [rows, tablePage, tableSize]);

  return (
    <Stack gap={6} className="admin-section">
      <div className="admin-section__toolbar">
        <div className="admin-section__filters">
          <TextInput
            id="couser-search"
            labelText="Search"
            placeholder="Search by name"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            id="couser-type-filter"
            labelText="User type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          >
            <SelectItem value="all" text="All" />
            <SelectItem value="internal" text="Internal" />
            <SelectItem value="external" text="External" />
          </Select>
        </div>
        <Button
          kind="primary"
          size="md"
          renderIcon={Add}
          iconDescription="Add co-user"
          onClick={openCreateModal}
        >
          Add co-user
        </Button>
      </div>

      <div className="bordered-table">
        <TableResource<CoUserRow>
          headers={tableHeaders}
          content={tableContent}
          loading={listQuery.isLoading}
          error={listQuery.isError}
          onPageChange={handlePageChange}
        />
      </div>

      <Modal
        open={isModalOpen}
        size="md"
        modalHeading={formState.id ? 'Edit Co-user' : 'Add Co-user'}
        passiveModal
        onRequestClose={closeModal}
        className="add-contact-modal"
      >
        <Stack gap={3} className="admin-modal__form">
          <Toggle
            id="couser-external"
            labelText="Co-user type"
            labelA="Internal (linked to org unit)"
            labelB="External (custom name)"
            toggled={formState.external}
            onToggle={(checked) =>
              setFormState((prev) => ({
                ...prev,
                external: checked,
                name: checked ? prev.name : '',
                orgUnit: checked ? null : prev.orgUnit,
              }))
            }
          />
          {formState.external ? (
            <TextInput
              id="couser-name"
              labelText="Name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Enter external co-user name"
            />
          ) : (
            <OrgUnitSelector
              id="couser-org-unit"
              labelText="Organizational unit"
              value={formState.orgUnit}
              onChange={(unit) => setFormState((prev) => ({ ...prev, orgUnit: unit }))}
            />
          )}
        </Stack>
        <div className="add-contact-modal__actions">
          <Button kind="secondary" size="md" onClick={closeModal}>
            Cancel
          </Button>
          <Button kind="primary" size="md" disabled={isBusy} onClick={handleSubmit}>
            {formState.id ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </Modal>

      <DestructiveModal
        open={deleteConfirmOpen}
        title="Delete co-user"
        message={`Are you sure you want to delete "${recordToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setRecordToDelete(null);
        }}
        loading={mutations.remove.isPending}
      />
    </Stack>
  );
};

export default CoUsersSection;
