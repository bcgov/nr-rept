/**
 * Validation utilities for REPT forms
 * Based on legacy nr-rept-main validation rules
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Phone number pattern: 111-222-3333
const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

// Email pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Project file pattern: 10620-30/00005-34
const PROJECT_FILE_PATTERN = /^\d{5}-\d{2}\/\d{5}-\d{2}$/;

// Date pattern: YYYY-MM-DD
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// IDIR pattern: IDIR\UserName
const IDIR_PATTERN = /^IDIR\\[A-Za-z0-9]+$/i;

/**
 * Validates a phone number matches the pattern 111-222-3333
 */
export const isValidPhoneNumber = (value: string | null | undefined): boolean => {
  if (!value || value.trim() === '') {
    return true; // Empty is valid (not required)
  }
  return PHONE_PATTERN.test(value.trim());
};

/**
 * Formats a phone number to 111-222-3333 format if possible
 * Accepts formats like: 1112223333, 111-222-3333, (111)-222-3333, (111)222-3333
 */
export const formatPhoneNumber = (value: string | null | undefined): string => {
  if (!value || value.trim() === '') {
    return '';
  }

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // If we have exactly 10 digits, format them
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  // Return original value if we can't format
  return value;
};

/**
 * Validates an email address
 */
export const isValidEmail = (value: string | null | undefined): boolean => {
  if (!value || value.trim() === '') {
    return true; // Empty is valid (not required)
  }
  return EMAIL_PATTERN.test(value.trim());
};

/**
 * Validates a date matches YYYY-MM-DD format
 */
export const isValidDate = (value: string | null | undefined): boolean => {
  if (!value || value.trim() === '') {
    return true;
  }
  return DATE_PATTERN.test(value.trim());
};

/**
 * Validates project file number format: 10620-30/00005-34
 */
export const isValidProjectFile = (value: string | null | undefined): boolean => {
  if (!value || value.trim() === '') {
    return true;
  }
  return PROJECT_FILE_PATTERN.test(value.trim());
};

/**
 * Validates IDIR format: IDIR\UserName
 */
export const isValidIdir = (value: string | null | undefined): boolean => {
  if (!value || value.trim() === '') {
    return true;
  }
  return IDIR_PATTERN.test(value.trim());
};

/**
 * Validates max length constraint
 */
export const isWithinMaxLength = (value: string | null | undefined, maxLength: number): boolean => {
  if (!value) {
    return true;
  }
  return value.length <= maxLength;
};

/**
 * Checks if a value is not empty
 */
export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim() !== '';
};

/**
 * Checks if a value is empty
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return value === null || value === undefined || value.trim() === '';
};
/**
 * Contact name validation rule from legacy system:
 * Either (First Name AND Last Name) must be specified, OR Company must be specified, but not all three.
 *
 * The rule uses XOR logic: (firstName && lastName) XOR companyName
 */
export const validateContactName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  companyName: string | null | undefined,
): { isValid: boolean; message: string } => {
  const hasFirstName = isNotEmpty(firstName);
  const hasLastName = isNotEmpty(lastName);
  const hasCompanyName = isNotEmpty(companyName);

  const hasPersonName = hasFirstName && hasLastName;

  // XOR logic: either person name OR company name, but not both and not neither
  const isValid =
    (hasPersonName && !hasCompanyName) || (!hasFirstName && !hasLastName && hasCompanyName);

  if (!isValid) {
    return {
      isValid: false,
      message:
        'Either First Name and Last Name must be specified, or Company must be specified, but not all three.',
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Field length constraints from legacy validation.xml
 */
export const FIELD_MAX_LENGTHS = {
  // Contact fields
  firstName: 50,
  lastName: 50,
  companyName: 50,
  address: 100,
  city: 50,
  province: 15,
  provinceState: 15,
  country: 25,
  postalCode: 9,
  postalZipCode: 9,
  emailAddress: 50,
  email: 50,
  phoneNumber: 12,
  phone: 12,
  faxNumber: 12,
  fax: 12,

  // Project fields
  projectName: 50,
  projectFile: 17, // 10620-30/00005-34

  // Other common fields
  sourceName: 255,
  legalDescription: 4000,
  comments: 4000,
  history: 4000,
} as const;

/**
 * Validates a contact form for create/update operations
 */
export interface ContactFormData {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  address?: string | null;
  city?: string | null;
  provinceState?: string | null;
  country?: string | null;
  postalZipCode?: string | null;
  email?: string | null;
  phone?: string | null;
  fax?: string | null;
}

export const validateContactForm = (data: ContactFormData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Contact name validation (XOR rule)
  const nameValidation = validateContactName(data.firstName, data.lastName, data.companyName);
  if (!nameValidation.isValid) {
    errors.push({ field: 'contactName', message: nameValidation.message });
  }

  if (isEmpty(data.address)) {
    errors.push({
      field: 'address',
      message: 'Address value is required.',
    });
  }

  if (isEmpty(data.city)) {
    errors.push({
      field: 'city',
      message: 'City value is required.',
    });
  }

  if (isEmpty(data.provinceState)) {
    errors.push({
      field: 'provinceState',
      message: 'Province/State value is required.',
    });
  }

  if (isEmpty(data.country)) {
    errors.push({
      field: 'country',
      message: 'Country value is required.',
    });
  }

  if (isEmpty(data.postalZipCode)) {
    errors.push({
      field: 'postalZipCode',
      message: 'Postal/Zip Code value is required.',
    });
  }

  // Max length validations
  if (!isWithinMaxLength(data.firstName, FIELD_MAX_LENGTHS.firstName)) {
    errors.push({
      field: 'firstName',
      message: `First Name cannot be greater than ${FIELD_MAX_LENGTHS.firstName} characters.`,
    });
  }

  if (!isWithinMaxLength(data.lastName, FIELD_MAX_LENGTHS.lastName)) {
    errors.push({
      field: 'lastName',
      message: `Last Name cannot be greater than ${FIELD_MAX_LENGTHS.lastName} characters.`,
    });
  }

  if (!isWithinMaxLength(data.companyName, FIELD_MAX_LENGTHS.companyName)) {
    errors.push({
      field: 'companyName',
      message: `Company cannot be greater than ${FIELD_MAX_LENGTHS.companyName} characters.`,
    });
  }

  if (!isWithinMaxLength(data.address, FIELD_MAX_LENGTHS.address)) {
    errors.push({
      field: 'address',
      message: `Address cannot be greater than ${FIELD_MAX_LENGTHS.address} characters.`,
    });
  }

  if (!isWithinMaxLength(data.city, FIELD_MAX_LENGTHS.city)) {
    errors.push({
      field: 'city',
      message: `City cannot be greater than ${FIELD_MAX_LENGTHS.city} characters.`,
    });
  }

  if (!isWithinMaxLength(data.provinceState, FIELD_MAX_LENGTHS.provinceState)) {
    errors.push({
      field: 'provinceState',
      message: `Province cannot be greater than ${FIELD_MAX_LENGTHS.provinceState} characters.`,
    });
  }

  if (!isWithinMaxLength(data.country, FIELD_MAX_LENGTHS.country)) {
    errors.push({
      field: 'country',
      message: `Country cannot be greater than ${FIELD_MAX_LENGTHS.country} characters.`,
    });
  }

  if (!isWithinMaxLength(data.postalZipCode, FIELD_MAX_LENGTHS.postalZipCode)) {
    errors.push({
      field: 'postalZipCode',
      message: `Postal Code cannot be greater than ${FIELD_MAX_LENGTHS.postalZipCode} characters.`,
    });
  }

  if (!isWithinMaxLength(data.email, FIELD_MAX_LENGTHS.email)) {
    errors.push({
      field: 'email',
      message: `Email Address cannot be greater than ${FIELD_MAX_LENGTHS.email} characters.`,
    });
  }

  // Email format validation
  if (!isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Email Address is an invalid e-mail address. Valid email addresses are abc@abc.abc',
    });
  }

  // Phone number format validation
  if (data.phone && data.phone.trim() !== '') {
    if (!isValidPhoneNumber(data.phone)) {
      errors.push({
        field: 'phone',
        message: 'Phone Number is not a valid phone number. Valid phone numbers are 111-222-3333.',
      });
    }
    if (!isWithinMaxLength(data.phone, FIELD_MAX_LENGTHS.phone)) {
      errors.push({
        field: 'phone',
        message: `Phone Number cannot be greater than ${FIELD_MAX_LENGTHS.phone} characters.`,
      });
    }
  }

  // Fax number format validation
  if (data.fax && data.fax.trim() !== '') {
    if (!isValidPhoneNumber(data.fax)) {
      errors.push({
        field: 'fax',
        message: 'Fax Number is not a valid phone number. Valid phone numbers are 111-222-3333.',
      });
    }
    if (!isWithinMaxLength(data.fax, FIELD_MAX_LENGTHS.fax)) {
      errors.push({
        field: 'fax',
        message: `Fax Number cannot be greater than ${FIELD_MAX_LENGTHS.fax} characters.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Gets the first error message for a specific field
 */
export const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find((e) => e.field === field)?.message;
};

/**
 * Gets all error messages as a combined string
 */
export const getAllErrorMessages = (errors: ValidationError[]): string => {
  return errors.map((e) => e.message).join(' ');
};

/**
 * Error messages matching legacy MessageResources.properties
 */
export const ERROR_MESSAGES = {
  required: (field: string) => `${field} is required.`,
  maxlength: (field: string, max: number) => `${field} can not be greater than ${max} characters.`,
  minlength: (field: string, min: number) => `${field} can not be less than ${min} characters.`,
  invalid: (field: string) => `${field} is invalid.`,
  email: (field: string) =>
    `${field} is an invalid e-mail address. Valid email addresses are abc@abc.abc`,
  phoneNumber: (field: string) =>
    `${field} is not a valid phone number. Valid phone numbers are 111-222-3333.`,
  date: (field: string) => `${field} is not a valid date. Valid dates are YYYY-MM-DD.`,
  integer: (field: string) => `${field} must be an integer.`,
  number: (field: string) => `${field} must be a number.`,
  currency: (field: string) => `${field} is not a valid monetary amount.`,
  projectFile: (field: string) =>
    `${field} is not a valid project file number. It must be of the form 10620-30/00005-34.`,
  idir: () => 'User name must be of the format IDIR\\UserName.',
  contactName: () =>
    'Either First Name and Last Name must be specified, or Company must be specified, but not all three.',
  bothOrNeither: (field1: string, field2: string) =>
    `${field1} and ${field2} must either be both blank, or both specified.`,
} as const;
