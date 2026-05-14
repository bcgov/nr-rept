import { DatePicker, DatePickerInput, TextInput } from '@carbon/react';

import type { PropertyRegistrationEditFormProps } from './types';

const PropertyRegistrationForm: React.FC<PropertyRegistrationEditFormProps> = ({
  formState,
  onChange,
}) => (
  <div className="property-edit-form">
    <div className="form-row form-row--quad">
      <TextInput
        id="ltoPlanNumber"
        labelText="LTO Plan Number"
        value={formState.ltoPlanNumber}
        onChange={(e) => onChange('ltoPlanNumber', e.target.value)}
      />
      <TextInput
        id="ltoDocumentNumber"
        labelText="LTO Document Number"
        value={formState.ltoDocumentNumber}
        onChange={(e) => onChange('ltoDocumentNumber', e.target.value)}
      />
      <TextInput
        id="surveyTubeNumber"
        labelText="Survey Tube Number"
        value={formState.surveyTubeNumber}
        onChange={(e) => onChange('surveyTubeNumber', e.target.value)}
      />
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.registrationDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('registrationDate', date ? date.toISOString().split('T')[0] : '');
        }}
      >
        <DatePickerInput
          id="registrationDate"
          labelText="Registration Date"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
    </div>
  </div>
);

export default PropertyRegistrationForm;
