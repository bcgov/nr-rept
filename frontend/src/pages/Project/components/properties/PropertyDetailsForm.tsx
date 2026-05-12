import { Checkbox, NumberInput, Select, SelectItem, TextArea, TextInput } from '@carbon/react';

import type { PropertyDetailsEditFormProps } from './types';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const blockNonNumericKeys = (event: ReactKeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-'].includes(event.key)) {
    event.preventDefault();
  }
};

const PropertyDetailsForm: React.FC<PropertyDetailsEditFormProps> = ({
  formState,
  onChange,
  options,
  validationErrors = {},
}) => (
  <div className="property-edit-form">
    <div className="form-row">
      <TextInput
        id="titleNumber"
        labelText="Title Number"
        value={formState.titleNumber}
        onChange={(e) => onChange('titleNumber', e.target.value)}
      />
      <NumberInput
        id="parcelIdentifier"
        label="PID *"
        value={formState.parcelIdentifier}
        onChange={(_, { value }) => onChange('parcelIdentifier', String(value ?? ''))}
        onKeyDown={blockNonNumericKeys}
        invalid={Boolean(validationErrors.parcelIdentifier)}
        invalidText={validationErrors.parcelIdentifier}
        allowEmpty
        hideSteppers
      />
    </div>
    <div className="form-row">
      <Select
        id="landTitleOfficeCode"
        labelText="Land Title Office *"
        value={formState.landTitleOfficeCode}
        onChange={(e) => onChange('landTitleOfficeCode', e.target.value)}
        invalid={Boolean(validationErrors.landTitleOfficeCode)}
        invalidText={validationErrors.landTitleOfficeCode}
      >
        <SelectItem value="" text="Select..." />
        {options?.landTitleOffices?.map((opt) => (
          <SelectItem key={opt.code} value={opt.code} text={`${opt.code} - ${opt.label}`} />
        ))}
      </Select>
      <Select
        id="acquisitionCode"
        labelText="Acquisition Type *"
        value={formState.acquisitionCode}
        onChange={(e) => onChange('acquisitionCode', e.target.value)}
        invalid={Boolean(validationErrors.acquisitionCode)}
        invalidText={validationErrors.acquisitionCode}
      >
        <SelectItem value="" text="Select..." />
        {options?.acquisitionTypes?.map((opt) => (
          <SelectItem key={opt.code} value={opt.code} text={`${opt.code} - ${opt.label}`} />
        ))}
      </Select>
    </div>
    <div className="form-row">
      <Select
        id="electoralDistrictCode"
        labelText="Electoral District *"
        value={formState.electoralDistrictCode}
        onChange={(e) => onChange('electoralDistrictCode', e.target.value)}
        invalid={Boolean(validationErrors.electoralDistrictCode)}
        invalidText={validationErrors.electoralDistrictCode}
      >
        <SelectItem value="" text="Select..." />
        {options?.electoralDistricts?.map((opt) => (
          <SelectItem key={opt.code} value={opt.code} text={`${opt.code} - ${opt.label}`} />
        ))}
      </Select>
      <Select
        id="orgUnitNumber"
        labelText="Forest District *"
        value={formState.orgUnitNumber}
        onChange={(e) => onChange('orgUnitNumber', e.target.value)}
        invalid={Boolean(validationErrors.orgUnitNumber)}
        invalidText={validationErrors.orgUnitNumber}
      >
        <SelectItem value="" text="Select..." />
        {options?.forestDistricts?.map((opt) => (
          <SelectItem
            key={opt.orgUnitNo}
            value={String(opt.orgUnitNo)}
            text={opt.name ?? String(opt.orgUnitNo)}
          />
        ))}
      </Select>
    </div>
    <div className="form-row">
      <NumberInput
        id="parcelArea"
        label="Parent Area (ha) *"
        value={formState.parcelArea}
        onChange={(_, { value }) => onChange('parcelArea', String(value ?? ''))}
        onKeyDown={blockNonNumericKeys}
        invalid={Boolean(validationErrors.parcelArea)}
        invalidText={validationErrors.parcelArea}
        allowEmpty
        hideSteppers
      />
      <NumberInput
        id="projectArea"
        label="Taking Area (ha) *"
        value={formState.projectArea}
        onChange={(_, { value }) => onChange('projectArea', String(value ?? ''))}
        onKeyDown={blockNonNumericKeys}
        invalid={Boolean(validationErrors.projectArea)}
        invalidText={validationErrors.projectArea}
        allowEmpty
        hideSteppers
      />
      <NumberInput
        id="assessedValue"
        label="Assessed Value"
        value={formState.assessedValue}
        onChange={(_, { value }) => onChange('assessedValue', String(value ?? ''))}
        onKeyDown={blockNonNumericKeys}
        allowEmpty
        hideSteppers
      />
    </div>
    <div className="form-row">
      <TextInput
        id="parcelAddress"
        labelText="Property Address"
        value={formState.parcelAddress}
        onChange={(e) => onChange('parcelAddress', e.target.value)}
      />
      <TextInput
        id="city"
        labelText="City *"
        value={formState.city}
        onChange={(e) => onChange('city', e.target.value)}
        invalid={Boolean(validationErrors.city)}
        invalidText={validationErrors.city}
      />
    </div>
    <div className="form-row form-row--full">
      <TextArea
        id="legalDescription"
        labelText="Legal Description *"
        value={formState.legalDescription}
        onChange={(e) => onChange('legalDescription', e.target.value)}
        invalid={Boolean(validationErrors.legalDescription)}
        invalidText={validationErrors.legalDescription}
        rows={3}
      />
    </div>
    <div className="form-row">
      <Checkbox
        id="expropriationRecommended"
        labelText="Expropriation Recommended"
        checked={formState.expropriationRecommended}
        onChange={(_, { checked }) => onChange('expropriationRecommended', checked)}
      />
    </div>
  </div>
);

export default PropertyDetailsForm;
