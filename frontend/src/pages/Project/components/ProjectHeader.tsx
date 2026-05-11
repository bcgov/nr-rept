import { Tag } from '@carbon/react';

import { getStatusTagColor } from '@/components/core/StatusTag/utils';

import { displayValue } from '../utils';

import type { ReptProjectDetail } from '@/services/rept/types';
import type { FC } from 'react';

type ProjectHeaderProps = {
  project: ReptProjectDetail;
};

export const ProjectHeader: FC<ProjectHeaderProps> = ({ project }) => (
  <div className="project-header">
    <div className="project-header__title">
      <h1>{displayValue(project.projectName)}</h1>
      {project.statusLabel && (
        <Tag type={getStatusTagColor(project.statusLabel)} size="md">
          {project.statusLabel}
        </Tag>
      )}
    </div>
    <div className="project-meta">
      <span className="project-file">{displayValue(project.projectFile)}</span>
    </div>
  </div>
);
