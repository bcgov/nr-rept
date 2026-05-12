import { Add, Edit, TrashCan } from '@carbon/icons-react';
import { Button, IconButton, InlineNotification, Search, Stack, TextInput } from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FC } from 'react';

import DestructiveModal from '@/components/core/DestructiveModal';
import TableResource from '@/components/Form/TableResource';
import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import useDebounce from '@/hooks/useDebounce';
import { useContactMutations, useContactSearch } from '@/services/rept/admin/hooks';
import {
  validateContactForm,
  formatPhoneNumber,
  getFieldError,
  type ValidationError,
} from '@/utils/validation';

import { formatDisplayText, paginateRows, safeRevisionCount, trimToNull } from './sectionUtils';

import type { IdentifiableContent, TableHeaderType } from '@/components/Form/TableResource/types';
import type {
  ContactAdminDto,
  ContactSearchCriteria,
  ContactUpsertRequest,
} from '@/services/rept/admin/types';

const EMPTY_CRITERIA: ContactSearchCriteria = {};

type ContactRow = IdentifiableContent<{
  displayName: string;
  address: string;
  email: string;
  phone: string;
  record: ContactAdminDto;
}>;

const ContactsSection: FC = () => {
  const { display } = useNotification();
  const [filters, setFilters] = useState({ firstName: '', lastName: '', companyName: '' });
  const debouncedFilters = useDebounce(filters, 300);
  const [tablePage, setTablePage] = useState(0);
  const [tableSize, setTableSize] = useState(10);

  const criteria = useMemo<ContactSearchCriteria>(() => {
    const next: ContactSearchCriteria = {};
    const maybeFirst = trimToNull(debouncedFilters.firstName);
    const maybeLast = trimToNull(debouncedFilters.lastName);
    const maybeCompany = trimToNull(debouncedFilters.companyName);
    if (maybeFirst) next.firstName = maybeFirst;
    if (maybeLast) next.lastName = maybeLast;
    if (maybeCompany) next.companyName = maybeCompany;
    return Object.keys(next).length ? next : EMPTY_CRITERIA;
  }, [debouncedFilters]);

  const listQuery = useContactSearch(criteria, { enabled: true });
  const mutations = useContactMutations(criteria);

  useEffect(() => {
    if (listQuery.isError) {
      display({
        kind: 'error',
        title: 'Unable to load contacts',
        subtitle: (listQuery.error as Error).message,
        timeout: 9000,
      });
    }
  }, [listQuery.isError, listQuery.error, display]);

  const [formState, setFormState] = useState({
    id: undefined as number | undefined,
    revisionCount: null as number | null,
    firstName: '',
    lastName: '',
    companyName: '',
    address: '',
    city: '',
    provinceState: '',
    country: '',
    postalZipCode: '',
    email: '',
    phone: '',
    fax: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ContactAdminDto | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const rows = useMemo<ContactRow[]>(
    () =>
      (listQuery.data ?? []).map((record) => ({
        id: record.id,
        displayName: formatDisplayText(record.displayName),
        address: formatDisplayText(record.address),
        email: formatDisplayText(record.email),
        phone: formatDisplayText(record.phone),
        record,
      })),
    [listQuery.data],
  );
  const isBusy =
    mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;

  const resetForm = useCallback(() => {
    setFormState({
      id: undefined,
      revisionCount: null,
      firstName: '',
      lastName: '',
      companyName: '',
      address: '',
      city: '',
      provinceState: '',
      country: '',
      postalZipCode: '',
      email: '',
      phone: '',
      fax: '',
    });
    setValidationErrors([]);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((record: ContactAdminDto) => {
    setFormState({
      id: record.id,
      revisionCount: record.revisionCount ?? null,
      firstName: record.firstName ?? '',
      lastName: record.lastName ?? '',
      companyName: record.companyName ?? '',
      address: record.address ?? '',
      city: record.city ?? '',
      provinceState: record.provinceState ?? '',
      country: record.country ?? '',
      postalZipCode: record.postalZipCode ?? '',
      email: record.email ?? '',
      phone: record.phone ?? '',
      fax: record.fax ?? '',
    });
    setValidationErrors([]);
    setIsModalOpen(true);
  }, []);

  const handleFilterChange =
    (field: keyof typeof filters) => (event: ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async () => {
    // Validate the form before submitting
    const validation = validateContactForm(formState);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      display({
        kind: 'error',
        title: 'Validation Error',
        subtitle: validation.errors.map((e) => e.message).join(' '),
        timeout: 9000,
      });
      return;
    }

    // Clear any previous validation errors
    setValidationErrors([]);

    const payload: ContactUpsertRequest = {
      revisionCount: formState.id ? safeRevisionCount(formState.revisionCount) : undefined,
      firstName: trimToNull(formState.firstName),
      lastName: trimToNull(formState.lastName),
      companyName: trimToNull(formState.companyName),
      address: trimToNull(formState.address),
      city: trimToNull(formState.city),
      provinceState: trimToNull(formState.provinceState),
      country: trimToNull(formState.country),
      postalZipCode: trimToNull(formState.postalZipCode),
      email: trimToNull(formState.email),
      phone: formatPhoneNumber(trimToNull(formState.phone) ?? ''),
      fax: formatPhoneNumber(trimToNull(formState.fax) ?? ''),
    };

    try {
      if (formState.id) {
        await mutations.update.mutateAsync({ id: formState.id, payload });
        display({ kind: 'success', title: 'Contact updated', timeout: 7000 });
      } else {
        const created = await mutations.create.mutateAsync(payload);
        setFilters({
          firstName: created?.firstName ?? formState.firstName.trim(),
          lastName: created?.lastName ?? formState.lastName.trim(),
          companyName: created?.companyName ?? formState.companyName.trim(),
        });
        display({ kind: 'success', title: 'Contact created', timeout: 7000 });
      }
      closeModal();
    } catch (error) {
      display({
        kind: 'error',
        title: 'Request failed',
        subtitle: error instanceof Error ? error.message : 'Request failed',
        timeout: 9000,
      });
    }
  };

  const openDeleteConfirm = useCallback((record: ContactAdminDto) => {
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
      display({ kind: 'success', title: 'Contact removed', timeout: 7000 });
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      display({
        kind: 'error',
        title: 'Request failed',
        subtitle: error instanceof Error ? error.message : 'Request failed',
        timeout: 9000,
      });
    }
  };

  const tableHeaders: TableHeaderType<ContactRow>[] = useMemo(
    () => [
      { key: 'displayName', header: 'Name', selected: true },
      { key: 'address', header: 'Address', selected: true },
      { key: 'email', header: 'Email', selected: true },
      { key: 'phone', header: 'Phone', selected: true },
      {
        key: 'record',
        header: 'Actions',
        selected: true,
        renderAs: (value) => {
          const record = value as ContactAdminDto;
          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <IconButton
                kind="ghost"
                size="sm"
                label={`Edit ${record.displayName ?? record.id}`}
                onClick={() => openEditModal(record)}
              >
                <Edit />
              </IconButton>
              <IconButton
                kind="ghost"
                size="sm"
                label={`Delete ${record.displayName ?? record.id}`}
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
      <div className="admin-section__filters-actions" style={{ marginBottom: '1rem' }}>
        <Button
          kind="primary"
          renderIcon={Add}
          size="md"
          iconDescription="Add contact"
          onClick={openCreateModal}
        >
          Add contact
        </Button>
      </div>
      <div className="admin-section__toolbar admin-section__toolbar--stacked">
        <div className="admin-section__filters">
          <div>
            <label
              className="cds--label"
              style={{ marginBottom: '0.5rem' }}
              htmlFor="contact-filter-first"
            >
              First name
            </label>
            <Search
              id="contact-filter-first"
              size="md"
              labelText="First name"
              placeholder="e.g. Jane"
              closeButtonLabelText="Clear first name"
              value={filters.firstName}
              onChange={handleFilterChange('firstName')}
              onClear={() => setFilters((prev) => ({ ...prev, firstName: '' }))}
            />
          </div>
          <div>
            <label
              className="cds--label"
              style={{ marginBottom: '0.5rem' }}
              htmlFor="contact-filter-last"
            >
              Last name
            </label>
            <Search
              id="contact-filter-last"
              size="md"
              labelText="Last name"
              placeholder="e.g. Smith"
              closeButtonLabelText="Clear last name"
              value={filters.lastName}
              onChange={handleFilterChange('lastName')}
              onClear={() => setFilters((prev) => ({ ...prev, lastName: '' }))}
            />
          </div>
          <div>
            <label
              className="cds--label"
              style={{ marginBottom: '0.5rem' }}
              htmlFor="contact-filter-company"
            >
              Company name
            </label>
            <Search
              id="contact-filter-company"
              size="md"
              labelText="Company name"
              placeholder="e.g. Acme Corp"
              closeButtonLabelText="Clear company"
              value={filters.companyName}
              onChange={handleFilterChange('companyName')}
              onClear={() => setFilters((prev) => ({ ...prev, companyName: '' }))}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <Button
              type="button"
              kind="secondary"
              size="md"
              onClick={() => setFilters({ firstName: '', lastName: '', companyName: '' })}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className={(tableContent.page?.totalElements ?? 0) > 0 ? 'bordered-table' : undefined}>
        <TableResource<ContactRow>
          headers={tableHeaders}
          content={tableContent}
          loading={listQuery.isLoading}
          error={listQuery.isError}
          onPageChange={handlePageChange}
        />
      </div>

      <Modal
        open={isModalOpen}
        size="lg"
        modalHeading={formState.id ? 'Edit contact' : 'Add contact'}
        passiveModal
        onRequestClose={closeModal}
        className="add-contact-modal"
      >
        <Stack gap={3} className="admin-modal__form">
          {getFieldError(validationErrors, 'contactName') && (
            <InlineNotification
              kind="warning"
              lowContrast
              hideCloseButton
              subtitle={getFieldError(validationErrors, 'contactName')}
            />
          )}

          <div className="admin-form__grid">
            <TextInput
              id="contact-first"
              labelText="First name (max 50 chars)"
              value={formState.firstName}
              maxLength={50}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, firstName: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'firstName'))}
              invalidText={getFieldError(validationErrors, 'firstName')}
            />
            <TextInput
              id="contact-last"
              labelText="Last name (max 50 chars)"
              value={formState.lastName}
              maxLength={50}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, lastName: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'lastName'))}
              invalidText={getFieldError(validationErrors, 'lastName')}
            />
            <TextInput
              id="contact-company"
              labelText="Company (max 50 chars)"
              value={formState.companyName}
              maxLength={50}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, companyName: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'companyName'))}
              invalidText={getFieldError(validationErrors, 'companyName')}
            />
            <TextInput
              id="contact-address"
              labelText="Address (max 100 chars) *"
              value={formState.address}
              maxLength={100}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, address: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'address'))}
              invalidText={getFieldError(validationErrors, 'address')}
            />
            <TextInput
              id="contact-city"
              labelText="City (max 50 chars) *"
              value={formState.city}
              maxLength={50}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, city: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'city'))}
              invalidText={getFieldError(validationErrors, 'city')}
            />
            <TextInput
              id="contact-province"
              labelText="Province/State (max 15 chars) *"
              value={formState.provinceState}
              maxLength={15}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, provinceState: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'provinceState'))}
              invalidText={getFieldError(validationErrors, 'provinceState')}
            />
            <TextInput
              id="contact-country"
              labelText="Country (max 25 chars) *"
              value={formState.country}
              maxLength={25}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, country: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'country'))}
              invalidText={getFieldError(validationErrors, 'country')}
            />
            <TextInput
              id="contact-postal"
              labelText="Postal/Zip code (max 9 chars) *"
              value={formState.postalZipCode}
              maxLength={9}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, postalZipCode: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'postalZipCode'))}
              invalidText={getFieldError(validationErrors, 'postalZipCode')}
            />
            <TextInput
              id="contact-email"
              labelText="Email (max 50 chars)"
              type="email"
              value={formState.email}
              maxLength={50}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, email: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'email'))}
              invalidText={getFieldError(validationErrors, 'email')}
            />
            <TextInput
              id="contact-phone"
              labelText="Phone (format: 111-222-3333)"
              value={formState.phone}
              maxLength={12}
              placeholder="111-222-3333"
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, phone: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'phone'))}
              invalidText={getFieldError(validationErrors, 'phone')}
            />
            <TextInput
              id="contact-fax"
              labelText="Fax (format: 111-222-3333)"
              value={formState.fax}
              maxLength={12}
              placeholder="111-222-3333"
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, fax: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(validationErrors, 'fax'))}
              invalidText={getFieldError(validationErrors, 'fax')}
            />
          </div>
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
        title="Delete contact"
        message={`Are you sure you want to delete "${recordToDelete?.displayName || 'this contact'}"? This action cannot be undone.`}
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

export default ContactsSection;
