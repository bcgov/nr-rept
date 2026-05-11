import { DatePicker, DatePickerInput } from '@carbon/react';

import type { PropertyExpropriationEditFormProps } from './types';

const PropertyExpropriationForm: React.FC<PropertyExpropriationEditFormProps> = ({
  formState,
  onChange,
  validationErrors = {},
}) => (
  <div className="property-edit-form">
    <div className="form-row">
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.executiveApprovalDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('executiveApprovalDate', date ? date.toISOString().split('T')[0] : '');
        }}
      >
        <DatePickerInput
          id="executiveApprovalDate"
          labelText="Executive Approval Date *"
          invalid={Boolean(validationErrors.executiveApprovalDate)}
          invalidText={validationErrors.executiveApprovalDate}
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.consensualServiceDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('consensualServiceDate', date ? date.toISOString().split('T')[0] : '');
        }}
      >
        <DatePickerInput
          id="consensualServiceDate"
          labelText="Consensual Service Date"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
    </div>
    <div className="form-row">
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.noticeAdvancePaymentDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('noticeAdvancePaymentDate', date ? date.toISOString().split('T')[0] : '');
        }}
      >
        <DatePickerInput
          id="noticeAdvancePaymentDate"
          labelText="Notice of Advance Payment Date"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.vestingDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('vestingDate', date ? date.toISOString().split('T')[0] : '');
        }}
      >
        <DatePickerInput id="vestingDate" labelText="Vesting Date" placeholder="YYYY-MM-DD" />
      </DatePicker>
    </div>
  </div>
);

export default PropertyExpropriationForm;
