import { AddAlt as Add, Edit, TrashCan } from '@carbon/icons-react';
import { Button, IconButton, Select, SelectItem, Stack, TextInput, Toggle } from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import DestructiveModal from '@/components/core/DestructiveModal';
import StatusTag from '@/components/core/StatusTag';
import TableResource from '@/components/Form/TableResource';
import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import useDebounce from '@/hooks/useDebounce';
import {
  useQualifiedReceiverMutations,
  useQualifiedReceiverSearch,
} from '@/services/rept/admin/hooks';

import { paginateRows } from './sectionUtils';

import type { IdentifiableContent, TableHeaderType } from '@/components/Form/TableResource/types';
import type { QualifiedReceiverDto, QualifiedReceiverRequest } from '@/services/rept/admin/types';

type QualifiedReceiverRow = IdentifiableContent<{
  name: string;
  status: string;
  record: QualifiedReceiverDto;
}>;

const QualifiedReceiversSection: FC = () => {
  const { display } = useNotification();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const debouncedQuery = useDebounce(searchText, 300);
  const [tablePage, setTablePage] = useState(0);
  const [tableSize, setTableSize] = useState(10);

  const criteria = useMemo(
    () => ({
      query: debouncedQuery,
      active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    }),
    [debouncedQuery, activeFilter],
  );

  const listQuery = useQualifiedReceiverSearch(criteria);
  const mutations = useQualifiedReceiverMutations(criteria);

  useEffect(() => {
    if (listQuery.isError) {
      display({
        kind: 'error',
        title: 'Unable to load qualified receivers',
        subtitle: (listQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [listQuery.isError, listQuery.error, display]);

  const [formState, setFormState] = useState({
    id: undefined as number | undefined,
    name: '',
    active: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<QualifiedReceiverDto | null>(null);

  const showError = useCallback(
    (subtitle: string) => {
      display({ kind: 'error', title: 'Qualified receiver error', subtitle, timeout: 6000 });
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
    setFormState({ id: undefined, name: '', active: true });
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((record: QualifiedReceiverDto) => {
    setFormState({ id: record.id, name: record.name, active: record.active });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async () => {
    const trimmed = formState.name.trim();
    if (!trimmed) {
      showError('Source name is required');
      return;
    }

    const payload: QualifiedReceiverRequest = {
      sourceName: trimmed,
      active: formState.active,
    };

    try {
      if (formState.id) {
        await mutations.update.mutateAsync({ id: formState.id, payload });
        showSuccess('Qualified receiver updated');
      } else {
        await mutations.create.mutateAsync(payload);
        showSuccess('Qualified receiver created');
      }
      closeModal();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const openDeleteConfirm = useCallback((record: QualifiedReceiverDto) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!recordToDelete?.id) {
      return;
    }
    try {
      await mutations.remove.mutateAsync(recordToDelete.id);
      showSuccess('Qualified receiver removed');
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const rows = useMemo<QualifiedReceiverRow[]>(
    () =>
      (listQuery.data ?? []).map((record) => ({
        id: record.id,
        name: record.name,
        status: record.active ? 'Active' : 'Inactive',
        record,
      })),
    [listQuery.data],
  );
  const isBusy =
    mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;

  const tableHeaders: TableHeaderType<QualifiedReceiverRow>[] = useMemo(
    () => [
      { key: 'name', header: 'Source name', selected: true },
      {
        key: 'status',
        header: 'Status',
        selected: true,
        renderAs: (value) => <StatusTag value={value as string | null | undefined} />,
      },
      {
        key: 'record',
        header: 'Actions',
        selected: true,
        renderAs: (value) => {
          const record = value as QualifiedReceiverDto;
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
            id="qualified-search"
            labelText="Search"
            placeholder="Search by source name"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            id="qualified-active-filter"
            labelText="Status"
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}
          >
            <SelectItem value="all" text="All" />
            <SelectItem value="active" text="Active only" />
            <SelectItem value="inactive" text="Inactive only" />
          </Select>
        </div>
        <Button
          kind="primary"
          size="md"
          renderIcon={Add}
          iconDescription="Add qualified receiver"
          onClick={openCreateModal}
        >
          Add qualified receiver
        </Button>
      </div>

      <div className="bordered-table">
        <TableResource<QualifiedReceiverRow>
          headers={tableHeaders}
          content={tableContent}
          loading={listQuery.isLoading}
          error={listQuery.isError}
          onPageChange={handlePageChange}
        />
      </div>

      <Modal
        open={isModalOpen}
        modalHeading={formState.id ? 'Edit qualified receiver' : 'Add qualified receiver'}
        passiveModal
        onRequestClose={closeModal}
        className="add-contact-modal"
      >
        <Stack gap={3} className="admin-modal__form">
          <TextInput
            id="qualified-name"
            labelText="Source name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Enter source name"
          />
          <Toggle
            id="qualified-active"
            labelText="Active"
            labelA="Inactive"
            labelB="Active"
            toggled={formState.active}
            onToggle={(checked) => setFormState((prev) => ({ ...prev, active: checked }))}
          />
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
        title="Delete qualified receiver"
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

export default QualifiedReceiversSection;
