import { Checkbox, DatePicker, DatePickerInput, TextArea } from '@carbon/react';

import type { PropertyMilestonesEditFormProps } from './types';

/** Format a Date using local time to avoid UTC timezone shift. */
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PropertyMilestonesForm: React.FC<PropertyMilestonesEditFormProps> = ({
  formState,
  onChange,
}) => (
  <div className="property-edit-form">
    <h4 className="milestones-section-title">Assessment Milestones</h4>
    <div className="form-row form-row--quad">
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.ownerContactDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('ownerContactDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="ownerContactDate"
          labelText="Owner Contact Date"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.internalAppraisalDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('internalAppraisalDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="internalAppraisalDate"
          labelText="Internal Appraisal Date"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.roadValueRequestedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('roadValueRequestedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="roadValueRequestedDate"
          labelText="Road Value Requested"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.roadValueReceivedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('roadValueReceivedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="roadValueReceivedDate"
          labelText="Road Value Received"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.fundingRequestedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('fundingRequestedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="fundingRequestedDate"
          labelText="Funding Requested"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.fundingApprovedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('fundingApprovedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="fundingApprovedDate"
          labelText="Funding Approved"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.surveyRequestedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('surveyRequestedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="surveyRequestedDate"
          labelText="Survey Requested"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.surveyReceivedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('surveyReceivedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="surveyReceivedDate"
          labelText="Survey Received"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
    </div>
    <div className="form-row form-row--full">
      <TextArea
        id="assessmentComment"
        labelText="Assessment Comment"
        value={formState.assessmentComment}
        onChange={(e) => onChange('assessmentComment', e.target.value)}
        rows={2}
      />
    </div>

    <h4 className="milestones-section-title">Negotiation Milestones</h4>
    <div className="form-row form-row--quad">
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.feeAppraisalRequestedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('feeAppraisalRequestedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="feeAppraisalRequestedDate"
          labelText="Fee Appraisal Requested"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.feeAppraisalReceivedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('feeAppraisalReceivedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="feeAppraisalReceivedDate"
          labelText="Fee Appraisal Received"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.offerDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('offerDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput id="offerDate" labelText="Offer Date" placeholder="YYYY-MM-DD" />
      </DatePicker>
    </div>
    <div className="form-row form-row--full">
      <TextArea
        id="negotiationComment"
        labelText="Negotiation Comment"
        value={formState.negotiationComment}
        onChange={(e) => onChange('negotiationComment', e.target.value)}
        rows={2}
      />
    </div>

    <h4 className="milestones-section-title">Acquisition Milestones</h4>
    <div className="form-row form-row--quad">
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.offerAcceptedDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('offerAcceptedDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput
          id="offerAcceptedDate"
          labelText="Offer Accepted"
          placeholder="YYYY-MM-DD"
        />
      </DatePicker>
      <DatePicker
        datePickerType="single"
        dateFormat="Y-m-d"
        value={formState.completionDate}
        onChange={(dates: Date[]) => {
          const date = dates[0];
          onChange('completionDate', date ? toLocalDateString(date) : '');
        }}
      >
        <DatePickerInput id="completionDate" labelText="Completion Date" placeholder="YYYY-MM-DD" />
      </DatePicker>
    </div>
    <div className="form-row form-row--full">
      <TextArea
        id="acquisitionComment"
        labelText="Acquisition Comment"
        value={formState.acquisitionComment}
        onChange={(e) => onChange('acquisitionComment', e.target.value)}
        rows={2}
      />
    </div>
    <div className="form-row">
      <Checkbox
        id="milestoneExpropriationRecommended"
        labelText="Expropriation Recommended"
        checked={formState.expropriationRecommended}
        onChange={(_, { checked }) => onChange('expropriationRecommended', checked)}
      />
    </div>
  </div>
);

export default PropertyMilestonesForm;
