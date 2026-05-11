import { AddAlt as Add } from '@carbon/icons-react';
import { Button, Column, Grid, Select, SelectItem, Stack, TextInput, Tile } from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import StatusTag from '@/components/core/StatusTag';
import TableResource from '@/components/Form/TableResource';
import { useNotification } from '@/context/notification/useNotification';
import { usePageTitle } from '@/context/pageTitle/usePageTitle';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  useReptProjectFileSuffixes,
  useReptProjectSearch,
  useReptProjectSearchOptions,
} from '@/services/rept/hooks';

import type {
  IdentifiableContent,
  PageableResponse,
  TableHeaderType,
} from '@/components/Form/TableResource/types';
import type {
  CodeName,
  ReptProjectSearchParams,
  ReptProjectSearchResult,
} from '@/services/rept/types';
import type { ChangeEvent, FormEvent } from 'react';

import './projects.scss';

type SearchFormState = {
  projectFile: string;
  projectName: string;
  region: string;
  district: string;
  projectManager: string;
  status: string;
  filePrefix: string;
  fileSuffix: string;
};

type ProjectSearchRow = IdentifiableContent<{
  region: string | null;
  district: string | null;
  projectFile: { id: number; label: string };
  projectName: string | null;
  status: string | null;
}>;

const INITIAL_FORM_STATE: SearchFormState = {
  projectFile: '',
  projectName: '',
  region: '',
  district: '',
  projectManager: '',
  status: '',
  filePrefix: '',
  fileSuffix: '',
};

const STORAGE_KEY = 'rept.projectSearch.state';

type PersistedSearchState = {
  formState: SearchFormState;
  searchParams: ReptProjectSearchParams | null;
};

const loadPersistedState = (): PersistedSearchState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSearchState;
    if (!parsed || typeof parsed !== 'object' || !parsed.formState) return null;
    return {
      formState: { ...INITIAL_FORM_STATE, ...parsed.formState },
      searchParams: parsed.searchParams ?? null,
    };
  } catch {
    return null;
  }
};

const formatLabel = (label?: string | null, fallback?: string | number | null): string | null => {
  if (label && label.trim().length > 0) {
    return label.trim();
  }
  if (fallback !== undefined && fallback !== null) {
    return String(fallback);
  }
  return null;
};

const formatProjectNumber = (value?: number | null): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const raw = value.toString();
  return raw.length >= 5 ? raw : raw.padStart(5, '0');
};

const buildProjectFileLabel = (result: ReptProjectSearchResult): string | null => {
  const prefix = result.filePrefix?.trim() ?? '';
  const number = formatProjectNumber(result.projectNumber);
  const suffix = result.fileSuffix?.trim() ?? '';

  const hasPrefix = prefix.length > 0;
  const hasNumber = number.length > 0;
  const hasSuffix = suffix.length > 0;

  if (!hasPrefix && !hasNumber && !hasSuffix) {
    return null;
  }

  let base = '';

  if (hasPrefix && hasNumber) {
    base = `${prefix}/${number}`;
  } else if (hasPrefix) {
    base = prefix;
  } else if (hasNumber) {
    base = number;
  }

  if (hasSuffix) {
    return base.length ? `${base}-${suffix}` : suffix;
  }

  return base;
};

const sanitizeSearchParams = (
  criteria: SearchFormState,
  overrides: Partial<ReptProjectSearchParams> = {},
): ReptProjectSearchParams => {
  const params: ReptProjectSearchParams = {};
  const target = params as Record<string, unknown>;

  const assign = (field: keyof SearchFormState, key: keyof ReptProjectSearchParams) => {
    const value = criteria[field]?.trim();
    if (value) {
      target[key as string] = value;
    }
  };

  assign('projectFile', 'projectFile');
  assign('projectName', 'projectName');
  assign('region', 'region');
  assign('district', 'district');
  assign('projectManager', 'projectManager');
  assign('status', 'status');
  assign('filePrefix', 'filePrefix');
  assign('fileSuffix', 'fileSuffix');

  target.page = overrides.page ?? 0;
  target.size = overrides.size ?? 10;

  return params;
};

const getOptionLabel = (option: CodeName) => option.name?.trim() || option.code;

const formatCellText = (value: string | null | undefined) =>
  value && value.trim().length > 0 ? value.trim() : '—';

const ProjectSearchPage: FC = () => {
  const { setPageTitle } = usePageTitle();
  const { display } = useNotification();
  const { canCreate } = useAuthorization();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<SearchFormState>(
    () => loadPersistedState()?.formState ?? INITIAL_FORM_STATE,
  );
  const [searchParams, setSearchParams] = useState<ReptProjectSearchParams | null>(
    () => loadPersistedState()?.searchParams ?? null,
  );

  useEffect(() => {
    setPageTitle('Project search', 1);
  }, [setPageTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ formState, searchParams } satisfies PersistedSearchState),
      );
    } catch {
      // Quota or serialization issue — non-fatal; just skip persisting.
    }
  }, [formState, searchParams]);

  const optionsQuery = useReptProjectSearchOptions();
  const suffixesQuery = useReptProjectFileSuffixes(formState.filePrefix);
  const searchQuery = useReptProjectSearch(searchParams);

  useEffect(() => {
    if (optionsQuery.isError) {
      display({
        kind: 'error',
        title: 'Project search options are unavailable',
        subtitle: (optionsQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [optionsQuery.isError, optionsQuery.error, display]);

  useEffect(() => {
    if (searchQuery.isError) {
      display({
        kind: 'error',
        title: 'Project search failed',
        subtitle: (searchQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [searchQuery.isError, searchQuery.error, display]);

  const handleUpdate = useCallback((field: keyof SearchFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'filePrefix' ? { fileSuffix: '' } : {}),
    }));
  }, []);

  const handleTextChange =
    (field: keyof SearchFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      handleUpdate(field, event.target.value);
    };

  const handleSelectChange =
    (field: keyof SearchFormState) => (event: ChangeEvent<HTMLSelectElement>) => {
      handleUpdate(field, event.target.value);
    };

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSearchParams(sanitizeSearchParams(formState, { page: 0, size: searchParams?.size ?? 10 }));
    },
    [formState, searchParams?.size],
  );

  const handleReset = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setSearchParams(null);
  }, []);

  const handlePageChange = useCallback(({ page, pageSize }: { page: number; pageSize: number }) => {
    setSearchParams((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        page,
        size: pageSize,
      };
    });
  }, []);

  const tableHeaders: TableHeaderType<ProjectSearchRow>[] = useMemo(
    () => [
      {
        key: 'projectName',
        header: 'Project name',
        selected: true,
        renderAs: (value) => formatCellText(value as string | null | undefined),
      },
      {
        key: 'projectFile',
        header: 'Project file',
        selected: true,
        renderAs: (value) => {
          const entry = value as ProjectSearchRow['projectFile'];
          return (
            <Link className="project-search__link" to={`/projects/${entry.id}`}>
              {entry.label}
            </Link>
          );
        },
      },
      {
        key: 'region',
        header: 'Region',
        selected: true,
        renderAs: (value) => formatCellText(value as string | null | undefined),
      },
      {
        key: 'district',
        header: 'District',
        selected: true,
        renderAs: (value) => formatCellText(value as string | null | undefined),
      },
      {
        key: 'status',
        header: 'Status',
        selected: true,
        renderAs: (value) => <StatusTag value={value as string | null | undefined} />,
      },
    ],
    [],
  );

  const tableContent: PageableResponse<ProjectSearchRow> | undefined = useMemo(() => {
    if (!searchParams) {
      return undefined;
    }

    if (!searchQuery.data) {
      return {
        content: [],
        page: {
          size: searchParams.size ?? 10,
          number: searchParams.page ?? 0,
          totalElements: 0,
          totalPages: 0,
        },
      };
    }

    const { results, total, page, size } = searchQuery.data;

    // Sort results by project name (ascending) by default
    const sortedResults = [...results].sort((a, b) => {
      const nameA = a.projectName?.trim().toLowerCase() || '';
      const nameB = b.projectName?.trim().toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    const rows: ProjectSearchRow[] = sortedResults.map((result) => ({
      id: result.id,
      region: formatLabel(result.regionLabel, result.regionNumber),
      district: formatLabel(result.districtLabel, result.districtNumber),
      projectFile: {
        id: result.id,
        label: buildProjectFileLabel(result) ?? `Project ${result.id}`,
      },
      projectName: result.projectName?.trim() || null,
      status: formatLabel(result.statusLabel, result.statusCode),
    }));

    const totalPages = size > 0 ? Math.ceil(total / size) : 0;

    return {
      content: rows,
      page: {
        size,
        number: page,
        totalElements: total,
        totalPages,
      },
    };
  }, [searchParams, searchQuery.data]);

  const suffixOptions = formState.filePrefix ? (suffixesQuery.data ?? []) : [];

  const regions = optionsQuery.data?.regions ?? [];
  const districts = optionsQuery.data?.districts ?? [];
  const statuses = optionsQuery.data?.statuses ?? [];
  const managers = optionsQuery.data?.projectManagers ?? [];
  const prefixes = optionsQuery.data?.filePrefixes ?? [];

  return (
    <Grid fullWidth className="default-grid project-search-grid">
      <Column sm={4} md={8} lg={16}>
        <div className="project-search__header">
          <h1>Project search</h1>
          {canCreate && (
            <Button
              kind="primary"
              size="md"
              renderIcon={Add}
              onClick={() => navigate('/projects/create')}
            >
              Add project file
            </Button>
          )}
        </div>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <Tile className="project-search__tile">
          <form className="project-search__form" onSubmit={handleSubmit}>
            <div className="project-search__field-grid">
              <TextInput
                id="project-search-file"
                labelText="Project file"
                placeholder="Search by project file number"
                value={formState.projectFile}
                onChange={handleTextChange('projectFile')}
                disabled={optionsQuery.isLoading}
              />
              <TextInput
                id="project-search-name"
                labelText="Project name"
                placeholder="Search by project name"
                value={formState.projectName}
                onChange={handleTextChange('projectName')}
                disabled={optionsQuery.isLoading}
              />
              <Select
                id="project-search-region"
                labelText="Region"
                value={formState.region}
                onChange={handleSelectChange('region')}
                disabled={optionsQuery.isLoading}
              >
                <SelectItem value="" text="All regions" />
                {regions.map((region) => (
                  <SelectItem key={region.code} value={region.code} text={getOptionLabel(region)} />
                ))}
              </Select>
              <Select
                id="project-search-manager"
                labelText="Project manager"
                value={formState.projectManager}
                onChange={handleSelectChange('projectManager')}
                disabled={optionsQuery.isLoading}
              >
                <SelectItem value="" text="All project managers" />
                {managers.map((manager) => (
                  <SelectItem
                    key={manager.code}
                    value={manager.code}
                    text={getOptionLabel(manager)}
                  />
                ))}
              </Select>
              <Select
                id="project-search-district"
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
                    text={getOptionLabel(district)}
                  />
                ))}
              </Select>
              <Select
                id="project-search-status"
                labelText="Status"
                value={formState.status}
                onChange={handleSelectChange('status')}
                disabled={optionsQuery.isLoading}
              >
                <SelectItem value="" text="All statuses" />
                {statuses.map((status) => (
                  <SelectItem key={status.code} value={status.code} text={getOptionLabel(status)} />
                ))}
              </Select>
              <Select
                id="project-search-prefix"
                labelText="File prefix"
                value={formState.filePrefix}
                onChange={handleSelectChange('filePrefix')}
                disabled={optionsQuery.isLoading}
              >
                <SelectItem value="" text="All prefixes" />
                {prefixes.map((prefix) => (
                  <SelectItem key={prefix.code} value={prefix.code} text={getOptionLabel(prefix)} />
                ))}
              </Select>
              <Select
                id="project-search-suffix"
                labelText="File suffix"
                value={formState.fileSuffix}
                onChange={handleSelectChange('fileSuffix')}
                disabled={!formState.filePrefix || suffixesQuery.isLoading}
              >
                <SelectItem
                  value=""
                  text={formState.filePrefix ? 'All suffixes' : 'Select a prefix first'}
                />
                {suffixOptions.map((suffix) => (
                  <SelectItem key={suffix.code} value={suffix.code} text={getOptionLabel(suffix)} />
                ))}
              </Select>
            </div>

            <div className="project-search__actions">
              <Button kind="tertiary" size={'md'} type="button" onClick={handleReset}>
                Clear
              </Button>
              <Button type="submit" size={'md'} disabled={optionsQuery.isLoading}>
                Search
              </Button>
            </div>
          </form>
        </Tile>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <Tile className="project-search__tile">
          <Stack gap={4}>
            <div
              className={
                tableContent && (tableContent.page?.totalElements ?? 0) > 0
                  ? 'bordered-table'
                  : undefined
              }
            >
              <TableResource<ProjectSearchRow>
                headers={tableHeaders}
                content={tableContent as PageableResponse<ProjectSearchRow>}
                loading={searchQuery.isFetching}
                error={searchQuery.isError}
                displayRange
                onPageChange={handlePageChange}
              />
            </div>
          </Stack>
        </Tile>
      </Column>
    </Grid>
  );
};

export default ProjectSearchPage;
