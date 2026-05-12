import { Add, Edit, TrashCan } from '@carbon/icons-react';
import {
  Button,
  IconButton,
  RadioButton,
  RadioButtonGroup,
  Search,
  Select,
  SelectItem,
  Stack,
  TextInput,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import DestructiveModal from '@/components/core/DestructiveModal';
import TableResource from '@/components/Form/TableResource';
import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import useDebounce from '@/hooks/useDebounce';
import {
  useRequestingSourceMutations,
  useRequestingSourceSearch,
} from '@/services/rept/admin/hooks';

import OrgUnitSelector from './OrgUnitSelector';
import { describeOrgUnit, paginateRows, safeRevisionCount } from './sectionUtils';

import type { IdentifiableContent, TableHeaderType } from '@/components/Form/TableResource/types';
import type {
  OrgUnitSearchResult,
  RequestingSourceDto,
  RequestingSourceRequest,
  RequestingSourceSearch,
} from '@/services/rept/admin/types';

type RequestingSourceRow = IdentifiableContent<{
  name: string;
  type: string;
  orgUnit: string;
  record: RequestingSourceDto;
}>;

type RequestingSourceFormState = {
  id?: number;
  name: string;
  external: boolean;
  orgUnit: OrgUnitSearchResult | null;
  revisionCount: number | null;
};

const RequestingSourcesSection: FC = () => {
  const { display } = useNotification();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'external'>('all');
  const debouncedQuery = useDebounce(searchText, 300);
  const [tablePage, setTablePage] = useState(0);
  const [tableSize, setTableSize] = useState(10);

  const criteria: RequestingSourceSearch = useMemo(
    () => ({
      query: debouncedQuery,
      external: typeFilter === 'all' ? undefined : typeFilter === 'external',
    }),
    [debouncedQuery, typeFilter],
  );

  const listQuery = useRequestingSourceSearch(criteria);
  const mutations = useRequestingSourceMutations(criteria);

  useEffect(() => {
    if (listQuery.isError) {
      display({
        kind: 'error',
        title: 'Unable to load requesting sources',
        subtitle: (listQuery.error as Error).message,
        timeout: 9000,
      });
    }
  }, [listQuery.isError, listQuery.error, display]);

  const [formState, setFormState] = useState<RequestingSourceFormState>({
    id: undefined,
    name: '',
    external: false,
    orgUnit: null,
    revisionCount: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RequestingSourceDto | null>(null);

  const showError = useCallback(
    (subtitle: string) => {
      display({ kind: 'error', title: 'Requesting source error', subtitle, timeout: 9000 });
    },
    [display],
  );

  const showSuccess = useCallback(
    (title: string) => {
      display({ kind: 'success', title, timeout: 7000 });
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

  const openEditModal = useCallback((record: RequestingSourceDto) => {
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
    if (formState.external) {
      const trimmed = formState.name.trim();
      if (!trimmed) {
        showError('Name is required for external sources');
        return;
      }
      if (!formState.id) {
        const exists = (listQuery.data ?? []).some(
          (item) => item.external && item.name?.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) {
          showError('An external source with this name already exists');
          return;
        }
      }
    } else {
      if (!formState.orgUnit) {
        showError('Organizational unit is required for internal sources');
        return;
      }
      if (!formState.id) {
        const exists = (listQuery.data ?? []).some(
          (item) => !item.external && item.orgUnit?.number === formState.orgUnit?.number,
        );
        if (exists) {
          showError('An internal source already exists for this organizational unit');
          return;
        }
      }
    }

    const payload: RequestingSourceRequest = {
      name: formState.external ? formState.name.trim() : null,
      external: formState.external,
      orgUnitNumber: formState.external ? null : (formState.orgUnit?.number ?? null),
      revisionCount: formState.id ? safeRevisionCount(formState.revisionCount) : undefined,
    };

    try {
      if (formState.id) {
        await mutations.update.mutateAsync({ id: formState.id, payload });
        showSuccess('Requesting source updated');
      } else {
        const created = await mutations.create.mutateAsync(payload);
        setSearchText(created?.name ?? '');
        showSuccess('Requesting source created');
      }
      closeModal();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const openDeleteConfirm = useCallback((record: RequestingSourceDto) => {
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
      showSuccess('Requesting source removed');
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Request failed');
    }
  };

  const rows = useMemo<RequestingSourceRow[]>(
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

  const tableHeaders: TableHeaderType<RequestingSourceRow>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', selected: true },
      { key: 'type', header: 'Type', selected: true },
      { key: 'orgUnit', header: 'Org unit', selected: true },
      {
        key: 'record',
        header: 'Actions',
        selected: true,
        renderAs: (value) => {
          const record = value as RequestingSourceDto;
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
      <div className="admin-section__filters-actions" style={{ marginBottom: '-0.5rem' }}>
        <Button
          kind="primary"
          size="md"
          renderIcon={Add}
          iconDescription="Add requesting source"
          onClick={openCreateModal}
        >
          Add requesting source
        </Button>
      </div>
      <div className="admin-section__toolbar">
        <div className="admin-section__filters">
          <div>
            <label
              className="cds--label"
              style={{ marginBottom: '0.5rem' }}
              htmlFor="requesting-search"
            >
              Name
            </label>
            <Search
              id="requesting-search"
              size="md"
              labelText="Name"
              placeholder="Search by name"
              closeButtonLabelText="Clear search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onClear={() => setSearchText('')}
            />
          </div>
          <Select
            id="requesting-type-filter"
            labelText="Source type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          >
            <SelectItem value="all" text="All" />
            <SelectItem value="internal" text="Internal" />
            <SelectItem value="external" text="External" />
          </Select>
        </div>
      </div>

      <div className={(tableContent.page?.totalElements ?? 0) > 0 ? 'bordered-table' : undefined}>
        <TableResource<RequestingSourceRow>
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
        modalHeading={formState.id ? 'Edit requesting source' : 'Add requesting source'}
        passiveModal
        onRequestClose={closeModal}
        className="add-contact-modal"
      >
        <Stack gap={3} className="admin-modal__form">
          <RadioButtonGroup
            legendText="What type of requesting source is this?"
            name="requesting-external"
            orientation="vertical"
            valueSelected={formState.external ? 'external' : 'internal'}
            onChange={(value) =>
              setFormState((prev) => ({
                ...prev,
                external: value === 'external',
                name: value === 'external' ? prev.name : '',
                orgUnit: value === 'external' ? null : prev.orgUnit,
              }))
            }
          >
            <RadioButton
              id="requesting-external-internal"
              labelText="Internal - linked to org unit"
              value="internal"
            />
            <RadioButton
              id="requesting-external-external"
              labelText="External - custom name"
              value="external"
            />
          </RadioButtonGroup>
          {formState.external ? (
            <TextInput
              id="requesting-name"
              labelText="Name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Enter external source name"
            />
          ) : (
            <OrgUnitSelector
              id="requesting-org-unit"
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
          <Button
            kind="primary"
            size="md"
            disabled={isBusy || (formState.external ? !formState.name.trim() : !formState.orgUnit)}
            onClick={handleSubmit}
          >
            {formState.id ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </Modal>

      <DestructiveModal
        open={deleteConfirmOpen}
        title="Delete requesting source"
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

export default RequestingSourcesSection;
