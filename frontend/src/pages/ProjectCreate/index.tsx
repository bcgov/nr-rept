import { Search } from '@carbon/icons-react';
import {
  Button,
  Column,
  DatePicker,
  DatePickerInput,
  Grid,
  InlineLoading,
  Select,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
  Tile,
} from '@carbon/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FC,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { UserSearchModal } from '@/components/Form/UserSearchModal';
import { useNotification } from '@/context/notification/useNotification';
import { usePageTitle } from '@/context/pageTitle/usePageTitle';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useResolvedUserName } from '@/hooks/useResolvedUserName';
import {
  useCreateReptProject,
  useReptProjectCreateOptions,
  useReptProjectFileSuffixes,
} from '@/services/rept/hooks';

import type { CodeName, ReptProjectCreateRequest } from '@/services/rept/types';
import type { ReptUserSummary } from '@/services/rept/types';

import './project-create.scss';

const EMPTY_CODE_LIST: CodeName[] = [];

type FormState = {
  filePrefix: string;
  fileSuffix: string;
  projectName: string;
  statusCode: string;
  regionNumber: string;
  districtNumber: string;
  bctsOfficeNumber: string;
  requestingSourceId: string;
  requestorUserId: string;
  requestDate: string;
  additionalNotes: string;
};

const buildInitialState = (): FormState => ({
  filePrefix: '',
  fileSuffix: '',
  projectName: '',
  statusCode: '',
  regionNumber: '',
  districtNumber: '',
  bctsOfficeNumber: '',
  requestingSourceId: '',
  requestorUserId: '',
  requestDate: new Date().toISOString().slice(0, 10),
  additionalNotes: '',
});

const getOptionLabel = (option: CodeName) => option.name?.trim() || option.code;

const isBlank = (value?: string | null) => !value || value.trim().length === 0;

const validateForm = (
  formState: FormState,
  suffixOptions: CodeName[],
  suffixesError: boolean,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(formState.filePrefix)) {
    errors.filePrefix = 'Select a file prefix.';
  }

  if (isBlank(formState.filePrefix)) {
    errors.fileSuffix = 'Select a prefix first.';
  } else if (suffixesError) {
    errors.fileSuffix = 'Suffixes failed to load.';
  } else if (suffixOptions.length === 0) {
    errors.fileSuffix = 'No suffixes available for this prefix.';
  } else if (isBlank(formState.fileSuffix)) {
    errors.fileSuffix = 'Select a file suffix.';
  }

  if (isBlank(formState.projectName)) {
    errors.projectName = 'Project name is required.';
  }

  if (isBlank(formState.statusCode)) {
    errors.statusCode = 'Select a status.';
  }

  if (isBlank(formState.regionNumber)) {
    errors.regionNumber = 'Select a region.';
  }

  if (isBlank(formState.districtNumber)) {
    errors.districtNumber = 'Select a district.';
  }

  if (isBlank(formState.requestingSourceId)) {
    errors.requestingSourceId = 'Select a requesting source.';
  }

  if (isBlank(formState.requestDate)) {
    errors.requestDate = 'Provide a request date.';
  }

  return errors;
};

const ProjectCreatePage: FC = () => {
  const navigate = useNavigate();
  const { setPageTitle } = usePageTitle();
  const { canCreate } = useAuthorization();

  const { display } = useNotification();
  const [formState, setFormState] = useState<FormState>(() => buildInitialState());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Resolve requestor IDIR to display name
  const { displayValue: resolvedRequestor, isLoading: isRequestorLoading } = useResolvedUserName(
    formState.requestorUserId,
  );

  const optionsQuery = useReptProjectCreateOptions();
  const suffixesQuery = useReptProjectFileSuffixes(formState.filePrefix);
  const { refetch: refetchSuffixes } = suffixesQuery;
  const lastRefetchedPrefix = useRef<string | null>(null);

  useEffect(() => {
    const normalizedPrefix = formState.filePrefix?.trim() ?? '';
    if (isBlank(normalizedPrefix)) {
      lastRefetchedPrefix.current = null;
      return;
    }
    if (lastRefetchedPrefix.current === normalizedPrefix) {
      return;
    }
    lastRefetchedPrefix.current = normalizedPrefix;
    void refetchSuffixes();
  }, [formState.filePrefix, refetchSuffixes]);
  const createMutation = useCreateReptProject();

  useEffect(() => {
    setPageTitle('Add project file', 1);
  }, [setPageTitle]);

  const statuses = optionsQuery.data?.statuses ?? EMPTY_CODE_LIST;
  const regions = optionsQuery.data?.regions ?? EMPTY_CODE_LIST;
  const districts = optionsQuery.data?.districts ?? EMPTY_CODE_LIST;
  const bctsOffices = optionsQuery.data?.bctsOffices ?? EMPTY_CODE_LIST;
  const requestingSources = optionsQuery.data?.requestingSources ?? EMPTY_CODE_LIST;
  const prefixes = optionsQuery.data?.filePrefixes ?? EMPTY_CODE_LIST;

  const defaultStatusCode = useMemo(() => {
    const pending = statuses.find((status) => status.code === 'PND');
    return pending?.code ?? statuses[0]?.code ?? '';
  }, [statuses]);

  useEffect(() => {
    if (!formState.statusCode && defaultStatusCode) {
      setFormState((prev) => ({ ...prev, statusCode: defaultStatusCode }));
    }
  }, [defaultStatusCode, formState.statusCode]);

  const clearForm = useCallback(() => {
    setFormState(() => ({
      ...buildInitialState(),
      statusCode: defaultStatusCode ?? '',
    }));
    setValidationErrors({});
  }, [defaultStatusCode]);

  const suffixOptions = useMemo(() => {
    if (isBlank(formState.filePrefix)) {
      return EMPTY_CODE_LIST;
    }
    return suffixesQuery.data ?? EMPTY_CODE_LIST;
  }, [formState.filePrefix, suffixesQuery.data]);

  useEffect(() => {
    if (
      !isBlank(formState.filePrefix) &&
      suffixOptions.length > 0 &&
      !suffixOptions.some((suffix) => suffix.code === formState.fileSuffix)
    ) {
      setFormState((prev) => ({ ...prev, fileSuffix: suffixOptions[0]?.code ?? '' }));
    }
  }, [formState.filePrefix, formState.fileSuffix, suffixOptions]);

  const suffixPlaceholder = useMemo(() => {
    if (isBlank(formState.filePrefix)) {
      return 'Select a prefix first';
    }
    if (suffixesQuery.isLoading) {
      return 'Loading suffixes…';
    }
    if (suffixesQuery.isError) {
      return 'Suffixes failed to load';
    }
    if (suffixOptions.length === 0) {
      return 'No suffixes available for this prefix';
    }
    return 'Select a file suffix';
  }, [formState.filePrefix, suffixOptions.length, suffixesQuery.isError, suffixesQuery.isLoading]);
  const isSubmitting = createMutation.isPending;

  const isSuffixDisabled =
    isBlank(formState.filePrefix) ||
    suffixesQuery.isLoading ||
    suffixesQuery.isError ||
    suffixOptions.length === 0 ||
    isSubmitting;

  const handleTextChange = useCallback(
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleOpenUserSearch = useCallback(() => {
    setIsUserModalOpen(true);
  }, []);

  const handleUserModalClose = useCallback(() => {
    setIsUserModalOpen(false);
  }, []);

  const handleUserSelected = useCallback((user: ReptUserSummary) => {
    const prefixedUserId = user.userId ? `IDIR\\${user.userId}` : '';
    setFormState((prev) => ({ ...prev, requestorUserId: prefixedUserId }));
  }, []);

  const handleSelectChange = useCallback(
    (field: keyof FormState) => (event: ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        ...(field === 'filePrefix' ? { fileSuffix: '' } : {}),
      }));
    },
    [],
  );

  const handleResetClick = useCallback(() => {
    clearForm();
    setValidationErrors({});
    createMutation.reset();
  }, [clearForm, createMutation]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const errors = validateForm(formState, suffixOptions, suffixesQuery.isError);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors({});
      createMutation.reset();

      const toOptional = (value: string) => (isBlank(value) ? undefined : value.trim());

      const payload: ReptProjectCreateRequest = {
        filePrefix: formState.filePrefix,
        fileSuffix: formState.fileSuffix,
        projectName: toOptional(formState.projectName),
        regionNumber: toOptional(formState.regionNumber),
        districtNumber: toOptional(formState.districtNumber),
        bctsOfficeNumber: toOptional(formState.bctsOfficeNumber),
        requestingSourceId: toOptional(formState.requestingSourceId),
        requestorUserId: toOptional(formState.requestorUserId),
        statusCode: formState.statusCode,
        requestDate: formState.requestDate,
      };

      try {
        const result = await createMutation.mutateAsync(payload);
        display({
          kind: 'success',
          title: 'Project file created',
          subtitle: result.projectFile
            ? `Project file ${result.projectFile} was created successfully.`
            : 'Project file was created successfully.',
          timeout: 7000,
        });
        clearForm();
        navigate(`/projects/${result.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create project file.';
        display({
          kind: 'error',
          title: 'Project file not created',
          subtitle: message,
          timeout: 9000,
        });
      }
    },
    [clearForm, createMutation, display, formState, navigate, suffixOptions, suffixesQuery.isError],
  );

  useEffect(() => {
    if (optionsQuery.isError) {
      display({
        kind: 'error',
        title: 'Lookup values are unavailable',
        subtitle: (optionsQuery.error as Error)?.message ?? 'Failed to load project file options.',
        timeout: 9000,
      });
    }
  }, [optionsQuery.isError, optionsQuery.error, display]);

  if (!canCreate) {
    return (
      <Grid fullWidth className="default-grid project-create-grid">
        <Column sm={4} md={8} lg={16}>
          <Tile>
            <h2>Access denied</h2>
            <p>You do not have permission to create projects.</p>
          </Tile>
        </Column>
      </Grid>
    );
  }

  return (
    <>
      <Grid fullWidth className="default-grid project-create-grid">
        <Column sm={4} md={8} lg={16}>
          <div className="page-title-container">
            <h1>Add project file</h1>
          </div>
        </Column>

        <Column sm={4} md={8} lg={16}>
          <Tile className="project-create__tile">
            <Stack gap={4}>
              <form className="project-create__form" onSubmit={handleSubmit} noValidate>
                <div className="project-create__field-grid">
                  <Select
                    id="project-create-prefix"
                    labelText="File prefix *"
                    value={formState.filePrefix}
                    onChange={handleSelectChange('filePrefix')}
                    disabled={optionsQuery.isLoading || isSubmitting}
                    invalid={Boolean(validationErrors.filePrefix)}
                    invalidText={validationErrors.filePrefix}
                  >
                    <SelectItem value="" text="Select a file prefix" />
                    {prefixes.map((prefix) => (
                      <SelectItem
                        key={prefix.code}
                        value={prefix.code}
                        text={getOptionLabel(prefix)}
                      />
                    ))}
                  </Select>

                  <Select
                    id="project-create-suffix"
                    labelText="File suffix *"
                    value={formState.fileSuffix}
                    onChange={handleSelectChange('fileSuffix')}
                    disabled={isSuffixDisabled}
                    invalid={Boolean(validationErrors.fileSuffix)}
                    invalidText={validationErrors.fileSuffix}
                  >
                    <SelectItem value="" text={suffixPlaceholder} />
                    {suffixOptions.map((suffix) => (
                      <SelectItem
                        key={suffix.code}
                        value={suffix.code}
                        text={getOptionLabel(suffix)}
                      />
                    ))}
                  </Select>

                  <TextInput
                    id="project-create-name"
                    labelText="Project name *"
                    placeholder="Enter project name"
                    value={formState.projectName}
                    onChange={handleTextChange('projectName')}
                    disabled={isSubmitting}
                    maxLength={80}
                    invalid={Boolean(validationErrors.projectName)}
                    invalidText={validationErrors.projectName}
                  />

                  <Select
                    id="project-create-status"
                    labelText="Status *"
                    value={formState.statusCode}
                    onChange={handleSelectChange('statusCode')}
                    disabled={optionsQuery.isLoading || isSubmitting}
                    invalid={Boolean(validationErrors.statusCode)}
                    invalidText={validationErrors.statusCode}
                  >
                    <SelectItem value="" text="Select a status" />
                    {statuses.map((status) => (
                      <SelectItem
                        key={status.code}
                        value={status.code}
                        text={getOptionLabel(status)}
                      />
                    ))}
                  </Select>

                  <Select
                    id="project-create-region"
                    labelText="Region *"
                    value={formState.regionNumber}
                    onChange={handleSelectChange('regionNumber')}
                    disabled={optionsQuery.isLoading || isSubmitting}
                    invalid={Boolean(validationErrors.regionNumber)}
                    invalidText={validationErrors.regionNumber}
                  >
                    <SelectItem value="" text="Select a region" />
                    {regions.map((region) => (
                      <SelectItem
                        key={region.code}
                        value={region.code}
                        text={getOptionLabel(region)}
                      />
                    ))}
                  </Select>

                  <Select
                    id="project-create-district"
                    labelText="District *"
                    value={formState.districtNumber}
                    onChange={handleSelectChange('districtNumber')}
                    disabled={optionsQuery.isLoading || isSubmitting}
                    invalid={Boolean(validationErrors.districtNumber)}
                    invalidText={validationErrors.districtNumber}
                  >
                    <SelectItem value="" text="Select a district" />
                    {districts.map((district) => (
                      <SelectItem
                        key={district.code}
                        value={district.code}
                        text={getOptionLabel(district)}
                      />
                    ))}
                  </Select>

                  <Select
                    id="project-create-bcts"
                    labelText="BCTS office"
                    value={formState.bctsOfficeNumber}
                    onChange={handleSelectChange('bctsOfficeNumber')}
                    disabled={optionsQuery.isLoading || isSubmitting}
                  >
                    <SelectItem value="" text="Select a BCTS office (optional)" />
                    {bctsOffices.map((office) => (
                      <SelectItem
                        key={office.code}
                        value={office.code}
                        text={getOptionLabel(office)}
                      />
                    ))}
                  </Select>

                  <Select
                    id="project-create-requesting-source"
                    labelText="Requesting source *"
                    value={formState.requestingSourceId}
                    onChange={handleSelectChange('requestingSourceId')}
                    disabled={optionsQuery.isLoading || isSubmitting}
                    invalid={Boolean(validationErrors.requestingSourceId)}
                    invalidText={validationErrors.requestingSourceId}
                  >
                    <SelectItem value="" text="Select a requesting source" />
                    {requestingSources.map((source) => (
                      <SelectItem
                        key={source.code}
                        value={source.code}
                        text={getOptionLabel(source)}
                      />
                    ))}
                  </Select>

                  <DatePicker
                    datePickerType="single"
                    dateFormat="Y-m-d"
                    value={formState.requestDate}
                    onChange={(dates: Date[]) => {
                      const date = dates[0];
                      setFormState((prev) => ({
                        ...prev,
                        requestDate: date ? date.toISOString().split('T')[0] : '',
                      }));
                    }}
                  >
                    <DatePickerInput
                      id="project-create-request-date"
                      labelText="Request date *"
                      placeholder="YYYY-MM-DD"
                      disabled={isSubmitting}
                      invalid={Boolean(validationErrors.requestDate)}
                      invalidText={validationErrors.requestDate}
                    />
                  </DatePicker>
                </div>

                <div className="user-lookup-field">
                  <TextInput
                    id="project-create-requestor"
                    labelText="Requestor user ID"
                    placeholder="User IDIR"
                    className="user-lookup-field__input"
                    value={resolvedRequestor}
                    readOnly
                  />
                  {isRequestorLoading && <InlineLoading description="Looking up user…" />}
                  <Button
                    type="button"
                    kind="ghost"
                    size="md"
                    renderIcon={Search}
                    iconDescription="Find a user"
                    onClick={handleOpenUserSearch}
                    disabled={isSubmitting}
                  >
                    Find user
                  </Button>
                </div>

                <TextArea
                  id="project-create-notes"
                  labelText="Comments"
                  placeholder="Add any relevant context (optional)"
                  value={formState.additionalNotes}
                  onChange={handleTextChange('additionalNotes')}
                  rows={4}
                  disabled={isSubmitting}
                />

                <div className="project-create__actions">
                  <Button
                    type="button"
                    kind="secondary"
                    size="md"
                    onClick={handleResetClick}
                    disabled={isSubmitting}
                  >
                    Reset form
                  </Button>
                  <Button type="submit" size="md" disabled={isSubmitting || optionsQuery.isLoading}>
                    {isSubmitting ? 'Creating…' : 'Create project file'}
                  </Button>
                </div>
              </form>
            </Stack>
          </Tile>
        </Column>
      </Grid>
      <UserSearchModal
        open={isUserModalOpen}
        onClose={handleUserModalClose}
        onSelect={handleUserSelected}
      />
    </>
  );
};

export default ProjectCreatePage;
