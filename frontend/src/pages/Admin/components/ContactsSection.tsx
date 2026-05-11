import { AddAlt as Add, Edit, TrashCan } from '@carbon/icons-react';
import { Button, IconButton, InlineNotification, Stack, TextInput } from '@carbon/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FC,
  type FormEvent,
} from 'react';

import DestructiveModal from '@/components/core/DestructiveModal';
import TableResource from '@/components/Form/TableResource';
import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
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
  company: string;
  email: string;
  phone: string;
  record: ContactAdminDto;
}>;

const ContactsSection: FC = () => {
  const { display } = useNotification();
  const [filters, setFilters] = useState({ firstName: '', lastName: '', companyName: '' });
  const [criteria, setCriteria] = useState<ContactSearchCriteria>(EMPTY_CRITERIA);
  const [tablePage, setTablePage] = useState(0);
  const [tableSize, setTableSize] = useState(10);

  const listQuery = useContactSearch(criteria, { enabled: true });
  const mutations = useContactMutations(criteria);

  useEffect(() => {
    if (listQuery.isError) {
      display({
        kind: 'error',
        title: 'Unable to load contacts',
        subtitle: (listQuery.error as Error).message,
        timeout: 6000,
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
        company: formatDisplayText(record.companyName),
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

  // Validate the form whenever it changes
  const formValidation = useMemo(() => validateContactForm(formState), [formState]);

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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCriteria: ContactSearchCriteria = {};
    const maybeFirst = trimToNull(filters.firstName);
    const maybeLast = trimToNull(filters.lastName);
    const maybeCompany = trimToNull(filters.companyName);

    if (maybeFirst) nextCriteria.firstName = maybeFirst;
    if (maybeLast) nextCriteria.lastName = maybeLast;
    if (maybeCompany) nextCriteria.companyName = maybeCompany;

    setCriteria(Object.keys(nextCriteria).length ? nextCriteria : EMPTY_CRITERIA);
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
        timeout: 6000,
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
        display({ kind: 'success', title: 'Contact updated', timeout: 4000 });
      } else {
        await mutations.create.mutateAsync(payload);
        display({ kind: 'success', title: 'Contact created', timeout: 4000 });
      }
      closeModal();
    } catch (error) {
      display({
        kind: 'error',
        title: 'Request failed',
        subtitle: error instanceof Error ? error.message : 'Request failed',
        timeout: 6000,
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
      display({ kind: 'success', title: 'Contact removed', timeout: 4000 });
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      display({
        kind: 'error',
        title: 'Request failed',
        subtitle: error instanceof Error ? error.message : 'Request failed',
        timeout: 6000,
      });
    }
  };

  const tableHeaders: TableHeaderType<ContactRow>[] = useMemo(
    () => [
      { key: 'displayName', header: 'Display name', selected: true },
      { key: 'company', header: 'Company', selected: true },
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
      <div className="admin-section__toolbar admin-section__toolbar--stacked">
        <form className="admin-section__filters" onSubmit={handleSearch}>
          <TextInput
            id="contact-filter-first"
            labelText="First name"
            placeholder="Filter by first name"
            value={filters.firstName}
            onChange={handleFilterChange('firstName')}
          />
          <TextInput
            id="contact-filter-last"
            labelText="Last name"
            placeholder="Filter by last name"
            value={filters.lastName}
            onChange={handleFilterChange('lastName')}
          />
          <TextInput
            id="contact-filter-company"
            labelText="Company"
            placeholder="Filter by company"
            value={filters.companyName}
            onChange={handleFilterChange('companyName')}
          />
          <div>
            <Button type="submit" size="md">
              Apply filters
            </Button>
          </div>
        </form>
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

      <div className="bordered-table">
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
          {getFieldError(formValidation.errors, 'contactName') && (
            <InlineNotification
              kind="warning"
              lowContrast
              hideCloseButton
              subtitle={getFieldError(formValidation.errors, 'contactName')}
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
              invalid={Boolean(getFieldError(formValidation.errors, 'firstName'))}
              invalidText={getFieldError(formValidation.errors, 'firstName')}
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
              invalid={Boolean(getFieldError(formValidation.errors, 'lastName'))}
              invalidText={getFieldError(formValidation.errors, 'lastName')}
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
              invalid={Boolean(getFieldError(formValidation.errors, 'companyName'))}
              invalidText={getFieldError(formValidation.errors, 'companyName')}
            />
            <TextInput
              id="contact-address"
              labelText="Address (max 100 chars)"
              value={formState.address}
              maxLength={100}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, address: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(formValidation.errors, 'address'))}
              invalidText={getFieldError(formValidation.errors, 'address')}
            />
            <TextInput
              id="contact-city"
              labelText="City (max 50 chars)"
              value={formState.city}
              maxLength={50}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, city: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(formValidation.errors, 'city'))}
              invalidText={getFieldError(formValidation.errors, 'city')}
            />
            <TextInput
              id="contact-province"
              labelText="Province/State (max 15 chars)"
              value={formState.provinceState}
              maxLength={15}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, provinceState: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(formValidation.errors, 'provinceState'))}
              invalidText={getFieldError(formValidation.errors, 'provinceState')}
            />
            <TextInput
              id="contact-country"
              labelText="Country (max 25 chars)"
              value={formState.country}
              maxLength={25}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, country: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(formValidation.errors, 'country'))}
              invalidText={getFieldError(formValidation.errors, 'country')}
            />
            <TextInput
              id="contact-postal"
              labelText="Postal/Zip code (max 9 chars)"
              value={formState.postalZipCode}
              maxLength={9}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, postalZipCode: event.target.value }));
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
              invalid={Boolean(getFieldError(formValidation.errors, 'postalZipCode'))}
              invalidText={getFieldError(formValidation.errors, 'postalZipCode')}
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
              invalid={Boolean(getFieldError(formValidation.errors, 'email'))}
              invalidText={getFieldError(formValidation.errors, 'email')}
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
              invalid={Boolean(getFieldError(formValidation.errors, 'phone'))}
              invalidText={getFieldError(formValidation.errors, 'phone')}
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
              invalid={Boolean(getFieldError(formValidation.errors, 'fax'))}
              invalidText={getFieldError(formValidation.errors, 'fax')}
            />
          </div>
        </Stack>
        <div className="add-contact-modal__actions">
          <Button kind="secondary" size="md" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            kind="primary"
            size="md"
            disabled={!formValidation.isValid || isBusy}
            onClick={handleSubmit}
          >
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
