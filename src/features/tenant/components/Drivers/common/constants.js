export const LICENSE_TYPES = ['LMV', 'MMV', 'HMV', 'TRANSPORT', 'LEARNER', 'INTERNATIONAL'];

export const DRIVER_TYPES = ['PERMANENT', 'CONTRACT', 'TEMPORARY', 'PART_TIME'];

export const DRIVER_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];

export const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];

export const VERIFICATION_STATUS = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'];

export const STATUS_STYLES = {
  // Driver Status
  ACTIVE:     { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  INACTIVE:   { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border border-gray-200' },
  ON_LEAVE:   { dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  SUSPENDED:  { dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  TERMINATED: { dot: 'bg-gray-600',   text: 'text-gray-700',   bg: 'bg-gray-100 border border-gray-300' },
  
  // Verification/Medical/Training Status
  VERIFIED:   { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  PENDING:    { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  REJECTED:   { dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  EXPIRED:    { dot: 'bg-gray-500',   text: 'text-gray-700',   bg: 'bg-gray-50 border border-gray-200' },

  // Attendance Status
  PRESENT:    { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  ABSENT:     { dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  HALF_DAY:   { dot: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200' },
  LEAVE:      { dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  LATE:       { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },

  // Incident Resolution Status
  OPEN:          { dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  INVESTIGATING: { dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  RESOLVED:      { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  CLOSED:        { dot: 'bg-gray-500',   text: 'text-gray-700',   bg: 'bg-gray-50 border border-gray-200' },
};

export const LICENSE_COLORS = {
  HMV:           'bg-purple-50 text-purple-700 border border-purple-200',
  LMV:           'bg-blue-50 text-blue-700 border border-blue-200',
  TRANSPORT:     'bg-orange-50 text-orange-700 border border-orange-200',
  MMV:           'bg-teal-50 text-teal-700 border border-teal-200',
  LEARNER:       'bg-yellow-50 text-yellow-700 border border-yellow-200',
  INTERNATIONAL: 'bg-green-50 text-green-700 border border-green-200',
};

export const DRIVER_TYPE_COLORS = {
  PERMANENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  CONTRACT:  'bg-orange-50 text-orange-700 border border-orange-200',
  TEMPORARY: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  PART_TIME: 'bg-gray-50 text-gray-600 border border-gray-200',
};

export const DOCUMENT_TYPES = ['AADHAR', 'PAN', 'LICENSE', 'PHOTO', 'ADDRESS_PROOF', 'EMPLOYMENT_LETTER', 'BACKGROUND_CHECK'];

export const INCIDENT_TYPES = ['ACCIDENT', 'TRAFFIC_VIOLATION', 'COMPLAINT', 'THEFT', 'VEHICLE_BREAKDOWN'];

export const INCIDENT_TYPE_STYLES = {
  ACCIDENT:          { text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  TRAFFIC_VIOLATION: { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  COMPLAINT:         { text: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200' },
  THEFT:             { text: 'text-purple-700', bg: 'bg-purple-50 border border-purple-200' },
  VEHICLE_BREAKDOWN: { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
};

export const SEVERITY_TYPES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const SEVERITY_STYLES = {
  LOW:      { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200 font-bold' },
  MEDIUM:   { text: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200 font-bold' },
  HIGH:     { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200 font-bold' },
  CRITICAL: { text: 'text-red-700',    bg: 'bg-red-50 border border-red-200 font-bold' },
};

export const TRAINING_TYPES = ['SAFETY', 'DEFENSIVE_DRIVING', 'FIRST_AID', 'HAZARDOUS_MATERIALS', 'CUSTOMER_SERVICE'];

export const ATTENDANCE_STATUS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'LATE'];

export const ASSIGNMENT_TYPES = ['PERMANENT', 'TEMPORARY'];

export const RESOLUTION_STATUS = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

export const PAYMENT_FREQUENCY = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'];

export const FREQUENCY_STYLES = {
  MONTHLY:  { text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  BIWEEKLY: { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  WEEKLY:   { text: 'text-purple-700', bg: 'bg-purple-50 border border-purple-200' },
};

// Aliases for compatibility
export const ASSIGNMENT_TYPE_STYLES = {
  PERMANENT: { text: 'text-indigo-700', bg: 'bg-indigo-50 border border-indigo-200' },
  TEMPORARY: { text: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200' },
};
export const ASSIGNMENT_STATUS_STYLES = STATUS_STYLES;

export const TRAINING_STATUS = VERIFICATION_STATUS;
export const TRAINING_STYLES = STATUS_STYLES;
export const FITNESS_STATUS = VERIFICATION_STATUS;
export const FITNESS_STYLES = STATUS_STYLES;
export const RESOLUTION_LIST = RESOLUTION_STATUS;
export const VERIFICATION_LIST = VERIFICATION_STATUS;
export const ATTENDANCE_STATUS_LIST = ATTENDANCE_STATUS;

