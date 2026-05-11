import {
  FilterableMultiSelect,
  TextInputSkeleton,
  type FilterableMultiSelectProps,
} from '@carbon/react';

/**
 * Props for the ActiveMultiSelect component.
 *
 * @template ItemType The type of the items in the multi-select.
 * @extends FilterableMultiSelectProps<ItemType>
 * @property {boolean} [showSkeleton=false] - If true, displays a skeleton loader instead of the multi-select component.
 */
interface ActiveMultiSelectProps<ItemType> extends FilterableMultiSelectProps<ItemType> {
  showSkeleton?: boolean;
}

/**
 * Renders the skeleton loader for the ActiveMultiSelect component.
 *
 * @returns {React.ReactElement} The skeleton loader component.
 */
const renderSkeleton = (): React.ReactElement => {
  return <TextInputSkeleton hideLabel />;
};

/**
 * Renders the FilterableMultiSelect component with default selection feedback.
 *
 * @template ItemType The type of the items in the multi-select.
 * @param selectionFeedback
 * @param {ActiveMultiSelectProps<ItemType>} props - The component props.
 * @returns {React.ReactElement} The multi-select component.
 */
const renderMultiSelect = <ItemType,>({
  selectionFeedback = 'top-after-reopen',
  ...props
}: ActiveMultiSelectProps<ItemType>): React.ReactElement => {
  return <FilterableMultiSelect {...props} selectionFeedback={selectionFeedback} />;
};

/**
 * ActiveMultiSelect is a custom multi-select component based on Carbon's `FilterableMultiSelect`.
 * It conditionally renders a skeleton loader (`TextInputSkeleton`) if `showSkeleton` is true.
 *
 * @template ItemType The type of the items in the multi-select.
 * @param showSkeleton
 * @param {ActiveMultiSelectProps<ItemType>} props - The component props.
 * @returns {React.ReactElement} The rendered component.
 */
const ActiveMultiSelect = <ItemType,>({
  showSkeleton = false,
  ...props
}: ActiveMultiSelectProps<ItemType>): React.ReactElement => {
  return showSkeleton ? renderSkeleton() : renderMultiSelect(props);
};

export default ActiveMultiSelect;
