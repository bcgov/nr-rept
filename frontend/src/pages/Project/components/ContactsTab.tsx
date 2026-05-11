import { AddAlt as Add, TrashCan } from '@carbon/icons-react';
import {
  Button,
  InlineNotification,
  Select,
  SelectItem,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  Tile,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useContactMutations } from '@/services/rept/admin/hooks';
import {
  useReptProjectContacts,
  useReptProjectContactOptions,
  useReptContactSearch,
  useAddReptProjectContact,
  useRemoveReptProjectContact,
} from '@/services/rept/hooks';
import {
  validateContactForm,
  formatPhoneNumber,
  getFieldError,
  type ValidationError,
} from '@/utils/validation';

import { displayValue, formatWithCode } from '../utils';

import type { ContactUpsertRequest } from '@/services/rept/admin/types';
import type { ReptContactAssociation, ReptContactSearchItem } from '@/services/rept/types';

type ContactsTabProps = {
  projectId: string;
};

const renderAssociation = (association: ReptContactAssociation) => {
  if (association.associationType === 'PROPERTY') {
    return (
      displayValue(association.propertyParcelIdentifier ?? association.propertyTitleNumber) ??
      'Property'
    );
  }
  return 'Project';
};

export const ContactsTab: FC<ContactsTabProps> = ({ projectId }) => {
  const { canCreate, canDelete } = useAuthorization();
  const { display } = useNotification();
  const projectContactsQuery = useReptProjectContacts(projectId);
  const contacts = projectContactsQuery.data?.results ?? [];

  useEffect(() => {
    if (projectContactsQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load contacts',
        subtitle: (projectContactsQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [projectContactsQuery.isError, projectContactsQuery.error, display]);
  const optionsQuery = useReptProjectContactOptions(projectId);
  const options = optionsQuery.data;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchFirstName, setSearchFirstName] = useState('');
  const [searchLastName, setSearchLastName] = useState('');
  const [searchCompanyName, setSearchCompanyName] = useState('');
  const [searchParams, setSearchParams] = useState<{
    firstName?: string;
    lastName?: string;
    companyName?: string;
    _nonce?: number;
  } | null>(null);
  const [selectedContact, setSelectedContact] = useState<ReptContactSearchItem | null>(null);
  const [selectedContactType, setSelectedContactType] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    associationId: number;
    contactTypeCode: string;
    displayName: string;
  } | null>(null);

  // Create new contact modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [newContact, setNewContact] = useState<ContactUpsertRequest>({
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

  // Validate the form whenever it changes
  const formValidation = useMemo(() => validateContactForm(newContact), [newContact]);

  const contactSearchQuery = useReptContactSearch(projectId, searchParams);
  const searchResults = contactSearchQuery.data?.contacts ?? [];

  const addMutation = useAddReptProjectContact(projectId);
  const removeMutation = useRemoveReptProjectContact(projectId);

  useEffect(() => {
    if (addMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to add contact',
        subtitle: (addMutation.error as Error).message,
        timeout: 6000,
      });
    }
  }, [addMutation.isError, addMutation.error, display]);

  useEffect(() => {
    if (removeMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to remove contact',
        subtitle: (removeMutation.error as Error).message,
        timeout: 6000,
      });
    }
  }, [removeMutation.isError, removeMutation.error, display]);

  // Contact create mutation - use empty criteria since we're not in admin view
  const contactMutations = useContactMutations({});
  const createContactMutation = contactMutations.create;

  useEffect(() => {
    if (createContactMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to create contact',
        subtitle: (createContactMutation.error as Error).message,
        timeout: 6000,
      });
    }
  }, [createContactMutation.isError, createContactMutation.error, display]);

  const handleOpenAddModal = useCallback(() => {
    setSearchFirstName('');
    setSearchLastName('');
    setSearchCompanyName('');
    setSearchParams(null);
    setSelectedContact(null);
    setSelectedContactType('');
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setSelectedContact(null);
    setSelectedContactType('');
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchFirstName.trim() && !searchLastName.trim() && !searchCompanyName.trim()) {
      return;
    }
    setSearchParams({
      firstName: searchFirstName.trim() || undefined,
      lastName: searchLastName.trim() || undefined,
      companyName: searchCompanyName.trim() || undefined,
      _nonce: Date.now(),
    });
    setSelectedContact(null);
  }, [searchFirstName, searchLastName, searchCompanyName]);

  const handleSelectContact = useCallback((contact: ReptContactSearchItem) => {
    setSelectedContact(contact);
  }, []);

  const handleAddContact = useCallback(() => {
    if (!selectedContact || !selectedContactType) {
      return;
    }

    addMutation.mutate(
      {
        contactId: selectedContact.id,
        contactTypeCode: selectedContactType,
      },
      {
        onSuccess: () => {
          display({
            kind: 'success',
            title: `Contact "${selectedContact.displayName ?? 'Unknown'}" added to project.`,
            timeout: 4000,
          });
          handleCloseAddModal();
        },
      },
    );
  }, [selectedContact, selectedContactType, addMutation, handleCloseAddModal, display]);

  const handleConfirmDelete = useCallback(
    (associationId: number, contactTypeCode: string, displayName: string) => {
      setDeleteConfirm({ associationId, contactTypeCode, displayName });
    },
    [],
  );

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Create new contact handlers
  const handleOpenCreateModal = useCallback(() => {
    // Pre-fill with search criteria
    setNewContact({
      firstName: searchFirstName.trim() || '',
      lastName: searchLastName.trim() || '',
      companyName: searchCompanyName.trim() || '',
      address: '',
      city: '',
      provinceState: '',
      country: '',
      postalZipCode: '',
      email: '',
      phone: '',
      fax: '',
    });
    // Close the Add modal first to avoid nested modal issues
    setIsAddModalOpen(false);
    setIsCreateModalOpen(true);
  }, [searchFirstName, searchLastName, searchCompanyName]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setValidationErrors([]);
    // Reopen the Add modal so user can continue the flow
    setIsAddModalOpen(true);
  }, []);

  const handleCreateContact = useCallback(() => {
    // Validate the form before submitting
    const validation = validateContactForm(newContact);
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

    // Format phone numbers before submitting (convert 1112223333 to 111-222-3333)
    const formattedContact = {
      ...newContact,
      phone: formatPhoneNumber(newContact.phone),
      fax: formatPhoneNumber(newContact.fax),
    };

    createContactMutation.mutate(formattedContact, {
      onSuccess: (createdContact) => {
        if (createdContact) {
          handleSearch();
          // Select the newly created contact
          setSelectedContact({
            id: createdContact.id,
            displayName:
              `${createdContact.firstName ?? ''} ${createdContact.lastName ?? ''}`.trim() ||
              createdContact.companyName ||
              'Unknown',
            firstName: createdContact.firstName,
            lastName: createdContact.lastName,
            companyName: createdContact.companyName,
            city: createdContact.city,
            phone: createdContact.phone,
            email: createdContact.email,
          });
          const displayName =
            `${createdContact.firstName ?? ''} ${createdContact.lastName ?? ''}`.trim() ||
            createdContact.companyName ||
            'Unknown';
          display({
            kind: 'success',
            title: `Contact "${displayName}" created successfully.`,
            subtitle: 'Please select a contact type.',
            timeout: 4000,
          });
        }
        handleCloseCreateModal();
      },
    });
  }, [
    newContact,
    createContactMutation,
    handleCloseCreateModal,
    handleSearch,
    display,
    setValidationErrors,
  ]);

  const updateNewContactField = useCallback(
    (field: keyof ContactUpsertRequest, value: string) => {
      setNewContact((prev) => ({ ...prev, [field]: value }));
      // Clear validation errors when user starts typing
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    },
    [validationErrors.length],
  );

  const handleRemoveContact = useCallback(() => {
    if (!deleteConfirm) {
      return;
    }

    removeMutation.mutate(
      {
        associationId: deleteConfirm.associationId,
      },
      {
        onSuccess: () => {
          display({
            kind: 'success',
            title: `Contact "${deleteConfirm.displayName}" removed from project.`,
            timeout: 4000,
          });
          setDeleteConfirm(null);
        },
      },
    );
  }, [deleteConfirm, removeMutation, display]);

  if (projectContactsQuery.isPending) {
    return (
      <div className="project-tab-panel">
        <SkeletonText width="60%" lineCount={4} />
      </div>
    );
  }

  if (projectContactsQuery.isError) {
    return (
      <div className="project-tab-panel">
        <p>Failed to load contacts.</p>
      </div>
    );
  }

  return (
    <div className="project-tab-panel">
      {!contacts.length ? (
        <>
          {canCreate && (
            <div className="tab-actions">
              <Button kind="primary" size="sm" renderIcon={Add} onClick={handleOpenAddModal}>
                Add Contact
              </Button>
            </div>
          )}
          <InlineNotification
            kind="info"
            lowContrast
            title="There aren't any contacts associated with this project."
            hideCloseButton
          />
        </>
      ) : (
        <Tile className="project-tile project-tile--full">
          <div className="project-tile__header">
            <h2 className="section-title">Project &amp; Property Contacts</h2>
            <div className="project-tile__actions">
              {canCreate && (
                <Button kind="primary" size="sm" renderIcon={Add} onClick={handleOpenAddModal}>
                  Add Contact
                </Button>
              )}
            </div>
          </div>

          <div className="bordered-table">
            <Table className="project-table" useZebraStyles>
              <TableHead>
                <TableRow>
                  <TableHeader>Association</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Contact Type</TableHeader>
                  <TableHeader>Company</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((association) => (
                  <TableRow key={association.associationId}>
                    <TableCell>{renderAssociation(association)}</TableCell>
                    <TableCell>{displayValue(association.contact.displayName)}</TableCell>
                    <TableCell>
                      {formatWithCode(
                        association.contact.contactTypeLabel,
                        association.contact.contactTypeCode,
                      )}
                    </TableCell>
                    <TableCell>{displayValue(association.contact.companyName)}</TableCell>
                    <TableCell>{displayValue(association.contact.phone)}</TableCell>
                    <TableCell>{displayValue(association.contact.email)}</TableCell>
                    <TableCell>
                      {association.associationType === 'PROJECT' && canDelete && (
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={TrashCan}
                          iconDescription="Remove contact"
                          hasIconOnly
                          onClick={() =>
                            handleConfirmDelete(
                              association.associationId,
                              association.contact.contactTypeCode ?? '',
                              association.contact.displayName ?? 'Unknown',
                            )
                          }
                          disabled={removeMutation.isPending}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tile>
      )}

      {/* Add Contact Modal */}
      <Modal
        open={isAddModalOpen}
        onRequestClose={handleCloseAddModal}
        modalHeading="Add Contact to Project"
        passiveModal
        size="lg"
        className="add-contact-modal"
      >
        <div className="contact-search-row">
          <TextInput
            id="searchFirstName"
            labelText="First Name"
            value={searchFirstName}
            onChange={(e) => setSearchFirstName(e.target.value)}
            placeholder="Enter first name..."
          />
          <TextInput
            id="searchLastName"
            labelText="Last Name"
            value={searchLastName}
            onChange={(e) => setSearchLastName(e.target.value)}
            placeholder="Enter last name..."
          />
          <TextInput
            id="searchCompanyName"
            labelText="Company Name"
            value={searchCompanyName}
            onChange={(e) => setSearchCompanyName(e.target.value)}
            placeholder="Enter company name..."
          />
          <Button
            kind="primary"
            size="md"
            onClick={handleSearch}
            disabled={
              (!searchFirstName.trim() && !searchLastName.trim() && !searchCompanyName.trim()) ||
              contactSearchQuery.isFetching
            }
          >
            {contactSearchQuery.isFetching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {searchParams && (
          <div style={{ marginBottom: '1rem' }}>
            {contactSearchQuery.isFetching ? (
              <SkeletonText lineCount={3} />
            ) : searchResults.length === 0 ? (
              <div>
                <p>No contacts found matching your search criteria.</p>
                {canCreate && (
                  <Button
                    kind="tertiary"
                    size="sm"
                    renderIcon={Add}
                    onClick={handleOpenCreateModal}
                    style={{ marginTop: '0.5rem' }}
                  >
                    Create New Contact
                  </Button>
                )}
              </div>
            ) : (
              <>
                <p style={{ marginBottom: '0.5rem' }}>
                  Found {searchResults.length} contact(s). Select one:
                </p>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader />
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Company</TableHeader>
                      <TableHeader>Email</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((contact) => (
                      <TableRow
                        key={contact.id}
                        isSelected={selectedContact?.id === contact.id}
                        onClick={() => handleSelectContact(contact)}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            name="selectedContact"
                            checked={selectedContact?.id === contact.id}
                            onChange={() => handleSelectContact(contact)}
                          />
                        </TableCell>
                        <TableCell>{contact.displayName}</TableCell>
                        <TableCell>{contact.companyName ?? '-'}</TableCell>
                        <TableCell>{contact.email ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}

        {selectedContact && (
          <div style={{ marginTop: '1rem' }}>
            <Select
              id="contactType"
              labelText="Contact Type *"
              value={selectedContactType}
              onChange={(e) => setSelectedContactType(e.target.value)}
            >
              <SelectItem value="" text="Select contact type..." />
              {options?.contactTypes.map((t) => (
                <SelectItem key={t.code} value={t.code} text={t.name ?? ''} />
              ))}
            </Select>
          </div>
        )}

        <div className="add-contact-modal__actions">
          <Button kind="secondary" size="md" onClick={handleCloseAddModal}>
            Cancel
          </Button>
          <Button
            kind="primary"
            size="md"
            disabled={!selectedContact || !selectedContactType || addMutation.isPending}
            onClick={handleAddContact}
          >
            Add Contact
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteConfirm)}
        onRequestClose={handleCancelDelete}
        modalHeading="Remove Contact"
        passiveModal
        size="sm"
        className="add-contact-modal"
      >
        <p>
          Are you sure you want to remove contact &quot;{deleteConfirm?.displayName}&quot; from this
          project?
        </p>
        <div className="add-contact-modal__actions">
          <Button kind="secondary" size="md" onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button
            kind="danger"
            size="md"
            disabled={removeMutation.isPending}
            onClick={handleRemoveContact}
          >
            Remove
          </Button>
        </div>
      </Modal>

      {/* Create New Contact Modal */}
      <Modal
        open={isCreateModalOpen}
        onRequestClose={handleCloseCreateModal}
        modalHeading="Create New Contact"
        passiveModal
        size="lg"
        className="add-contact-modal"
      >
        {getFieldError(formValidation.errors, 'contactName') && (
          <InlineNotification
            kind="warning"
            lowContrast
            hideCloseButton
            subtitle={getFieldError(formValidation.errors, 'contactName')}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <div className="form-fields">
          <TextInput
            id="newFirstName"
            labelText="First Name (max 50 chars)"
            value={newContact.firstName ?? ''}
            onChange={(e) => updateNewContactField('firstName', e.target.value)}
            placeholder="Enter first name..."
            maxLength={50}
            invalid={Boolean(getFieldError(formValidation.errors, 'firstName'))}
            invalidText={getFieldError(formValidation.errors, 'firstName')}
          />
          <TextInput
            id="newLastName"
            labelText="Last Name (max 50 chars)"
            value={newContact.lastName ?? ''}
            onChange={(e) => updateNewContactField('lastName', e.target.value)}
            placeholder="Enter last name..."
            maxLength={50}
            invalid={Boolean(getFieldError(formValidation.errors, 'lastName'))}
            invalidText={getFieldError(formValidation.errors, 'lastName')}
          />
          <TextInput
            id="newCompanyName"
            labelText="Company Name (max 50 chars)"
            value={newContact.companyName ?? ''}
            onChange={(e) => updateNewContactField('companyName', e.target.value)}
            placeholder="Enter company name..."
            maxLength={50}
            invalid={Boolean(getFieldError(formValidation.errors, 'companyName'))}
            invalidText={getFieldError(formValidation.errors, 'companyName')}
          />
          <TextInput
            id="newAddress"
            labelText="Address (max 100 chars)"
            value={newContact.address ?? ''}
            onChange={(e) => updateNewContactField('address', e.target.value)}
            placeholder="Enter address..."
            maxLength={100}
            invalid={Boolean(getFieldError(formValidation.errors, 'address'))}
            invalidText={getFieldError(formValidation.errors, 'address')}
          />
          <TextInput
            id="newCity"
            labelText="City (max 50 chars)"
            value={newContact.city ?? ''}
            onChange={(e) => updateNewContactField('city', e.target.value)}
            placeholder="Enter city..."
            maxLength={50}
            invalid={Boolean(getFieldError(formValidation.errors, 'city'))}
            invalidText={getFieldError(formValidation.errors, 'city')}
          />
          <TextInput
            id="newProvinceState"
            labelText="Province/State (max 15 chars)"
            value={newContact.provinceState ?? ''}
            onChange={(e) => updateNewContactField('provinceState', e.target.value)}
            placeholder="Enter province/state..."
            maxLength={15}
            invalid={Boolean(getFieldError(formValidation.errors, 'provinceState'))}
            invalidText={getFieldError(formValidation.errors, 'provinceState')}
          />
          <TextInput
            id="newCountry"
            labelText="Country (max 25 chars)"
            value={newContact.country ?? ''}
            onChange={(e) => updateNewContactField('country', e.target.value)}
            placeholder="Enter country..."
            maxLength={25}
            invalid={Boolean(getFieldError(formValidation.errors, 'country'))}
            invalidText={getFieldError(formValidation.errors, 'country')}
          />
          <TextInput
            id="newPostalZipCode"
            labelText="Postal/Zip Code (max 9 chars)"
            value={newContact.postalZipCode ?? ''}
            onChange={(e) => updateNewContactField('postalZipCode', e.target.value)}
            placeholder="Enter postal/zip code..."
            maxLength={9}
            invalid={Boolean(getFieldError(formValidation.errors, 'postalZipCode'))}
            invalidText={getFieldError(formValidation.errors, 'postalZipCode')}
          />
          <TextInput
            id="newEmail"
            labelText="Email (max 50 chars)"
            value={newContact.email ?? ''}
            onChange={(e) => updateNewContactField('email', e.target.value)}
            placeholder="Enter email (e.g., abc@abc.abc)..."
            maxLength={50}
            invalid={Boolean(getFieldError(formValidation.errors, 'email'))}
            invalidText={getFieldError(formValidation.errors, 'email')}
          />
          <TextInput
            id="newPhone"
            labelText="Phone (format: 111-222-3333)"
            value={newContact.phone ?? ''}
            onChange={(e) => updateNewContactField('phone', e.target.value)}
            placeholder="111-222-3333"
            maxLength={12}
            invalid={Boolean(getFieldError(formValidation.errors, 'phone'))}
            invalidText={getFieldError(formValidation.errors, 'phone')}
          />
          <TextInput
            id="newFax"
            labelText="Fax (format: 111-222-3333)"
            value={newContact.fax ?? ''}
            onChange={(e) => updateNewContactField('fax', e.target.value)}
            placeholder="111-222-3333"
            maxLength={12}
            invalid={Boolean(getFieldError(formValidation.errors, 'fax'))}
            invalidText={getFieldError(formValidation.errors, 'fax')}
          />
        </div>

        <div className="add-contact-modal__actions">
          <Button kind="secondary" size="md" onClick={handleCloseCreateModal}>
            Cancel
          </Button>
          <Button
            kind="primary"
            size="md"
            disabled={!formValidation.isValid || createContactMutation.isPending}
            onClick={handleCreateContact}
          >
            Create Contact
          </Button>
        </div>
      </Modal>
    </div>
  );
};
