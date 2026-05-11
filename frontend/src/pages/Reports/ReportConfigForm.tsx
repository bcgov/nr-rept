import {
  Button,
  Checkbox,
  InlineNotification,
  Select,
  SelectItem,
  Stack,
  TextInput,
} from '@carbon/react';
import { useEffect, useMemo, useState, type ChangeEvent, type FC, type FormEvent } from 'react';

import { useNotification } from '@/context/notification/useNotification';
import { useGenerateReport } from '@/services/reports/hooks';
import { useReptProjectCreateOptions, useReptProjectSearchOptions } from '@/services/rept/hooks';
import { openBlobInNewTab, triggerBrowserDownload } from '@/utils/download';

import { AGREEMENT_ACTIVE_OPTIONS, type ReportDefinition } from './reportDefinitions';

import type { ReportFormat, ReportRequestPayload } from '@/services/reports/types';
import type { CodeName } from '@/services/rept/types';

type ReportFormState = {
  startDate: string;
  endDate: string;
  agreementType: string;
  agreementActive: string;
  sortColumn: string;
  region: string;
  district: string;
  bctsOffice: string;
  agreementExists: boolean;
  projectStatus: string;
};

const BLANK_STATE: ReportFormState = {
  startDate: '',
  endDate: '',
  agreementType: '',
  agreementActive: '',
  sortColumn: '',
  region: '',
  district: '',
  bctsOffice: '',
  agreementExists: false,
  projectStatus: '',
};

const toOptionLabel = (entry: CodeName) => entry.name?.trim() || entry.code;

const sanitizePayload = (
  state: ReportFormState,
  definition: ReportDefinition,
  format: ReportFormat,
): ReportRequestPayload => {
  const payload: ReportRequestPayload = { format };

  const assignString = (key: keyof ReportRequestPayload, value: string) => {
    if (value && value.trim().length > 0) {
      (payload as Record<string, unknown>)[key as string] = value.trim();
    }
  };

  if (definition.fields.dateRange) {
    assignString('startDate', state.startDate);
    assignString('endDate', state.endDate);
  }
  if (definition.fields.agreementType) {
    assignString('agreementType', state.agreementType);
  }
  if (definition.fields.agreementActive) {
    assignString('agreementActive', state.agreementActive);
  }
  if (definition.fields.sortOptions) {
    assignString('sortColumn', state.sortColumn);
  }
  if (definition.fields.region) {
    assignString('region', state.region);
  }
  if (definition.fields.district) {
    assignString('district', state.district);
  }
  if (definition.fields.bctsOffice) {
    assignString('bctsOffice', state.bctsOffice);
  }
  if (definition.fields.agreementExists) {
    (payload as Record<string, unknown>).agreementExists = state.agreementExists;
  }
  if (definition.fields.projectStatus) {
    assignString('projectStatus', state.projectStatus);
  }

  return payload;
};

const createDefaultState = (definition: ReportDefinition): ReportFormState => {
  let sortColumn = (definition.defaults?.sortColumn as string | undefined) ?? '';
  if (!sortColumn && definition.fields.sortOptions && definition.fields.sortOptions.length > 0) {
    sortColumn = definition.fields.sortOptions[0].value;
  }
  return { ...BLANK_STATE, sortColumn };
};

export type ReportConfigFormProps = {
  definition: ReportDefinition;
};

const ReportConfigForm: FC<ReportConfigFormProps> = ({ definition }) => {
  const { display } = useNotification();
  const defaultState = useMemo(() => createDefaultState(definition), [definition]);
  const [formState, setFormState] = useState<ReportFormState>(defaultState);

  useEffect(() => {
    setFormState(defaultState);
  }, [defaultState]);

  const optionsQuery = useReptProjectSearchOptions();
  // BCTS office list lives on the project-create options endpoint, not the
  // project-search one; only fetch it when this report actually needs it.
  const createOptionsQuery = useReptProjectCreateOptions();
  const reportMutation = useGenerateReport(definition.id);

  const handleChange = (field: keyof ReportFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange =
    (field: keyof ReportFormState) => (event: ChangeEvent<HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const generate = async (format: ReportFormat) => {
    try {
      const payload = sanitizePayload(formState, definition, format);
      reportMutation.reset();
      const response = await reportMutation.mutateAsync(payload);
      if (format === 'pdf') {
        openBlobInNewTab(response.blob);
      } else {
        triggerBrowserDownload(response.blob, response.filename);
      }
      display({
        title: `${definition.title} ready`,
        subtitle: format === 'pdf' ? 'Opened in a new tab' : `Downloaded ${response.filename}`,
        kind: 'success',
        timeout: 4000,
      });
    } catch (error) {
      const message = (error as Error).message ?? 'An unexpected error occurred';
      display({
        title: `Unable to generate ${definition.title}`,
        subtitle: message,
        kind: 'error',
        timeout: 6000,
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void generate(definition.availableFormats[0] ?? 'pdf');
  };

  const handleReset = () => {
    setFormState(defaultState);
    reportMutation.reset();
  };

  const regions = optionsQuery.data?.regions ?? [];
  const districts = optionsQuery.data?.districts ?? [];
  const statuses = optionsQuery.data?.statuses ?? [];
  const bctsOffices = createOptionsQuery.data?.bctsOffices ?? [];

  const supportsPdf = definition.availableFormats.includes('pdf');
  const supportsCsv = definition.availableFormats.includes('csv');

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <Stack gap={5}>
        {optionsQuery.isError && (
          <InlineNotification
            kind="warning"
            lowContrast
            title="Filter options unavailable"
            subtitle={(optionsQuery.error as Error)?.message ?? 'Failed to load lookup values.'}
          />
        )}

        {definition.fields.dateRange && (
          <div className="report-form__field-group">
            <TextInput
              id={`report-${definition.id}-start-date`}
              type="date"
              labelText="Start date"
              value={formState.startDate}
              onChange={handleChange('startDate')}
            />
            <TextInput
              id={`report-${definition.id}-end-date`}
              type="date"
              labelText="End date"
              value={formState.endDate}
              onChange={handleChange('endDate')}
            />
          </div>
        )}

        {definition.fields.agreementType && (
          <Select
            id={`report-${definition.id}-agreement-type`}
            labelText="Agreement type"
            value={formState.agreementType}
            onChange={handleSelectChange('agreementType')}
          >
            <SelectItem value="" text="All types" />
            <SelectItem value="ACQUISITION" text="Acquisition" />
            <SelectItem value="DISPOSITION" text="Disposition" />
          </Select>
        )}

        {definition.fields.agreementActive && (
          <Select
            id={`report-${definition.id}-agreement-active`}
            labelText="Agreement active"
            value={formState.agreementActive}
            onChange={handleSelectChange('agreementActive')}
          >
            {AGREEMENT_ACTIVE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} text={option.label} />
            ))}
          </Select>
        )}

        {definition.fields.region && (
          <Select
            id={`report-${definition.id}-region`}
            labelText="Region"
            value={formState.region}
            onChange={handleSelectChange('region')}
            disabled={optionsQuery.isLoading}
          >
            <SelectItem value="" text="All regions" />
            {regions.map((region) => (
              <SelectItem key={region.code} value={region.code} text={toOptionLabel(region)} />
            ))}
          </Select>
        )}

        {definition.fields.district && (
          <Select
            id={`report-${definition.id}-district`}
            labelText="District"
            value={formState.district}
            onChange={handleSelectChange('district')}
            disabled={optionsQuery.isLoading}
          >
            <SelectItem value="" text="All districts" />
            {districts.map((district) => (
              <SelectItem
                key={district.code}
                value={district.code}
                text={toOptionLabel(district)}
              />
            ))}
          </Select>
        )}

        {definition.fields.bctsOffice && (
          <Select
            id={`report-${definition.id}-bcts`}
            labelText="BCTS office"
            value={formState.bctsOffice}
            onChange={handleSelectChange('bctsOffice')}
            disabled={createOptionsQuery.isLoading}
          >
            <SelectItem value="" text="All BCTS offices" />
            {bctsOffices.map((office) => (
              <SelectItem key={office.code} value={office.code} text={toOptionLabel(office)} />
            ))}
          </Select>
        )}

        {definition.fields.projectStatus && (
          <Select
            id={`report-${definition.id}-project-status`}
            labelText="Project status"
            value={formState.projectStatus}
            onChange={handleSelectChange('projectStatus')}
            disabled={optionsQuery.isLoading}
          >
            <SelectItem value="" text="All statuses" />
            {statuses.map((status) => (
              <SelectItem key={status.code} value={status.code} text={toOptionLabel(status)} />
            ))}
          </Select>
        )}

        {definition.fields.sortOptions && (
          <Select
            id={`report-${definition.id}-sort`}
            labelText="Sort by"
            value={formState.sortColumn}
            onChange={handleSelectChange('sortColumn')}
          >
            {definition.fields.sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} text={option.label} />
            ))}
          </Select>
        )}

        {definition.fields.agreementExists && (
          <Checkbox
            id={`report-${definition.id}-agreement-exists`}
            labelText="Only projects with agreements"
            checked={formState.agreementExists}
            onChange={(_, { checked }) =>
              setFormState((prev) => ({ ...prev, agreementExists: checked }))
            }
          />
        )}

        <div className="report-form__actions">
          <Button
            kind="tertiary"
            size="md"
            type="button"
            onClick={handleReset}
            disabled={reportMutation.isPending}
          >
            Reset
          </Button>
          {supportsCsv && (
            <Button
              kind="secondary"
              size="md"
              type="button"
              onClick={() => void generate('csv')}
              disabled={reportMutation.isPending}
            >
              Export CSV
            </Button>
          )}
          {supportsPdf && (
            <Button
              kind="primary"
              size="md"
              type="button"
              onClick={() => void generate('pdf')}
              disabled={reportMutation.isPending}
            >
              {reportMutation.isPending ? 'Generating…' : 'Generate PDF'}
            </Button>
          )}
        </div>
      </Stack>
    </form>
  );
};

export default ReportConfigForm;
