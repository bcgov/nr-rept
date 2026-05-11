import * as Icons from '@carbon/icons-react';
import * as Pictograms from '@carbon/pictograms-react';
import { type FC } from 'react';

import Subtitle from '@/components/core/Subtitle';
import './index.scss';

interface EmptySectionProps {
  icon?: keyof typeof Icons;
  title: string;
  description: string | React.ReactNode;
  pictogram?: keyof typeof Pictograms;
  className?: string;
  whiteLayer?: boolean;
}

/**
 * EmptySection component used to display a placeholder or empty state.
 *
 * Supports optional Carbon icons or pictograms, a title, and a description.
 *
 * @component
 * @example
 * ```tsx
 * <EmptySection
 *   icon="WarningFilled"
 *   title="No Data Available"
 *   description="Please check back later."
 * />
 * ```
 *
 * @param {keyof typeof Icons} [icon] - Optional Carbon icon name.
 * @param {string} title - Title text for the empty section.
 * @param {string | React.ReactNode} description - Supporting description text.
 * @param {keyof typeof Pictograms} [pictogram] - Optional Carbon pictogram name.
 * @param {string} [className] - Optional custom class names.
 * @param {boolean} [whiteLayer] - Optional flag to apply white background layer.
 * @returns {JSX.Element} A styled empty state section.
 */
const EmptySection: FC<EmptySectionProps> = ({
  icon,
  title,
  description,
  pictogram,
  whiteLayer,
  className,
}) => {
  let Img: React.ElementType | undefined;

  if (icon && Icons[icon]) {
    Img = Icons[icon] as React.ElementType;
  }

  if (pictogram && Pictograms[pictogram]) {
    Img = Pictograms[pictogram] as React.ElementType;
  }

  return (
    <div
      className={`${className ?? ''} empty-section-container ${whiteLayer ? 'empty-section-white-layer' : undefined}`}
    >
      {Img ? <Img className="empty-section-icon" data-testid="empty-section-icon" /> : null}
      <div className="empty-section-title">{title}</div>
      <Subtitle className="empty-section-subtitle" text={description} />
    </div>
  );
};

export default EmptySection;
