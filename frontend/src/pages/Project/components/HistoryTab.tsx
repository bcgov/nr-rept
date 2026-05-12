import { Edit } from '@carbon/icons-react';
import { Button, SkeletonText, TextArea, Tile } from '@carbon/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';

import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useUpdateReptProject } from '@/services/rept/hooks';

import { displayValue } from '../utils';

const MAX_LENGTH = 4000;

import { FieldList, type DetailField } from './FieldList';

import type { ReptProjectDetail } from '@/services/rept/types';

type HistoryTabProps = {
  projectId: string;
  project: ReptProjectDetail;
};

type HistoryFormState = {
  projectHistory: string;
  relatedFiles: string;
  relatedRegistrations: string;
  projectComment: string;
};

const createFormState = (project: ReptProjectDetail): HistoryFormState => ({
  projectHistory: project.projectHistory ?? '',
  relatedFiles: project.relatedFiles ?? '',
  relatedRegistrations: project.relatedRegistrations ?? '',
  projectComment: project.projectComment ?? '',
});

const normalizeNullableString = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const buildHistoryFields = (project: ReptProjectDetail): DetailField[] => [
  { label: 'Project History', value: displayValue(project.projectHistory) },
  { label: 'Related Files', value: displayValue(project.relatedFiles) },
  { label: 'Related Registrations', value: displayValue(project.relatedRegistrations) },
  { label: 'Comments', value: displayValue(project.projectComment) },
];

export const HistoryTab: FC<HistoryTabProps> = ({ projectId, project }) => {
  const { canEdit } = useAuthorization();
  const { display } = useNotification();
  const mutation = useUpdateReptProject(projectId);
  const resetMutation = useCallback(() => mutation.reset(), [mutation]);

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<HistoryFormState>(() => createFormState(project));
  const [initialFormState, setInitialFormState] = useState<HistoryFormState>(() =>
    createFormState(project),
  );
  const projectKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (mutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save history',
        subtitle: (mutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [mutation.isError, mutation.error, display]);

  // Reset form when project data changes
  useEffect(() => {
    const key = `${project.id}-${project.revisionCount ?? '0'}`;
    if (projectKeyRef.current === key) {
      return;
    }
    projectKeyRef.current = key;
    const nextState = createFormState(project);
    setInitialFormState(nextState);
    setFormState(nextState);
    setIsEditing(false);
    resetMutation();
  }, [project, resetMutation]);

  const hasChanges = useMemo(() => {
    return (
      formState.projectHistory !== initialFormState.projectHistory ||
      formState.relatedFiles !== initialFormState.relatedFiles ||
      formState.relatedRegistrations !== initialFormState.relatedRegistrations ||
      formState.projectComment !== initialFormState.projectComment
    );
  }, [formState, initialFormState]);

  const handleStartEdit = useCallback(() => {
    setFormState(initialFormState);
    setIsEditing(true);
  }, [initialFormState]);

  const handleCancelEdit = useCallback(() => {
    setFormState(initialFormState);
    setIsEditing(false);
  }, [initialFormState]);

  const handleFieldChange = useCallback((key: keyof HistoryFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const revisionCount = project.revisionCount;
    if (revisionCount === null || revisionCount === undefined) {
      return;
    }

    // Send full project payload, overriding only the history fields
    mutation.mutate(
      {
        revisionCount,
        projectName: project.projectName ?? null,
        statusCode: project.statusCode ?? null,
        priorityCode: project.priorityCode,
        regionNumber: project.regionNumber,
        districtNumber: project.districtNumber,
        bctsOfficeNumber: project.bctsOfficeNumber,
        requestDate: project.requestDate ?? null,
        requestorUserId: project.requestorUserId,
        requestingSourceId: project.requestingSourceId,
        projectManagerUserId: project.projectManagerUserId,
        projectManagerName: project.projectManagerName,
        projectManagerAssignedDate: project.projectManagerAssignedDate,
        projectHistory: normalizeNullableString(formState.projectHistory),
        relatedFiles: normalizeNullableString(formState.relatedFiles),
        relatedRegistrations: normalizeNullableString(formState.relatedRegistrations),
        projectComment: normalizeNullableString(formState.projectComment),
      },
      {
        onSuccess: () => {
          display({ kind: 'success', title: 'History saved.', timeout: 7000 });
          setIsEditing(false);
        },
      },
    );
  }, [project, formState, mutation, display]);

  const editDisabledReason = useMemo(() => {
    if (project.revisionCount === null || project.revisionCount === undefined) {
      return 'Revision metadata is required before editing.';
    }
    return null;
  }, [project]);

  const historyFields = buildHistoryFields(project);

  if (!project) {
    return (
      <div className="project-tab-panel">
        <SkeletonText width="60%" lineCount={4} />
      </div>
    );
  }

  // Read-only mode
  if (!isEditing) {
    return (
      <div className="project-tab-panel">
        <Tile className="project-tile project-tile--full">
          <div className="project-tile__header">
            <h2 className="section-title">Project History</h2>
            <div className="project-tile__actions">
              {canEdit && (
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Edit}
                  onClick={handleStartEdit}
                  disabled={Boolean(editDisabledReason)}
                  title={editDisabledReason ?? undefined}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
          <div className="field-list--horizontal">
            <FieldList fields={historyFields} keyPrefix="project-history" />
          </div>
        </Tile>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="project-tab-panel">
      <Tile className="project-tile project-tile--full">
        <div className="form-fields form-fields--stacked">
          <TextArea
            id="projectHistory"
            labelText="Project History"
            value={formState.projectHistory}
            onChange={(e) => handleFieldChange('projectHistory', e.target.value)}
            rows={4}
            maxLength={MAX_LENGTH}
          />
          <TextArea
            id="relatedFiles"
            labelText="Related Files"
            value={formState.relatedFiles}
            onChange={(e) => handleFieldChange('relatedFiles', e.target.value)}
            rows={4}
            maxLength={MAX_LENGTH}
          />
          <TextArea
            id="relatedRegistrations"
            labelText="Related Registrations"
            value={formState.relatedRegistrations}
            onChange={(e) => handleFieldChange('relatedRegistrations', e.target.value)}
            rows={4}
            maxLength={MAX_LENGTH}
          />
          <TextArea
            id="projectComment"
            labelText="Comments"
            value={formState.projectComment}
            onChange={(e) => handleFieldChange('projectComment', e.target.value)}
            rows={4}
            maxLength={MAX_LENGTH}
          />
        </div>
      </Tile>

      <div className="form-actions">
        <Button kind="secondary" size="sm" onClick={handleCancelEdit}>
          Cancel
        </Button>
        <Button
          kind="primary"
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || mutation.isPending}
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
