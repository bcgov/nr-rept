import { type FC, type ReactNode } from 'react';
import './index.scss';

/**
 * Subtitle component used to display section subtitles or supporting text.
 *
 * @component
 * @example
 * ```tsx
 * <Subtitle text="User Settings" />
 * ```
 *
 * @param {string | ReactNode} text - The subtitle content to display.
 * @param {string} [className] - Optional additional class names for styling.
 * @returns {JSX.Element} A styled paragraph element containing the subtitle.
 */
interface SubtitleProps {
  text: string | ReactNode;
  className?: string;
}

const Subtitle: FC<SubtitleProps> = ({ text, className }) => (
  <p className={className ? `${className} subtitle-section` : 'subtitle-section'}>{text}</p>
);

export default Subtitle;
