/**
 * Utility functions for the Drivers feature area.
 */

/**
 * Returns the full name of a driver formatted correctly.
 * Handles middle_name optionally.
 */
export const getDriverName = (driver) => {
  if (!driver) return '—';
  const u = driver.user ?? driver;
  const parts = [u.first_name, u.middle_name, u.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return driver.driver_name || '-';
};

/**
 * Returns initials for a given name.
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Returns a consistent color background class for an avatar based on a string (e.g. name).
 */
export const getAvatarColor = (name) => {
  const colors = [
    'bg-[#3b7ef8]', // Premium Blue
    'bg-[#16a34a]', // Green
    'bg-[#f59e0b]', // Amber
    'bg-[#d946ef]', // Fuchsia
    'bg-[#8b5cf6]', // Violet
    'bg-[#ec4899]', // Pink
    'bg-[#ef4444]', // Red
    'bg-[#06b6d4]', // Cyan
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Clean object by converting empty strings to null.
 * Useful for handling optional fields in API requests.
 */
export const cleanObject = (obj) => {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      // Basic text fields that should be "" instead of null
      if (['middle_name', 'phone', 'alternate_phone'].includes(k) && v === '') return [k, ''];
      return [k, v === '' ? null : v];
    })
  );
};

/**
 * Returns a color class based on document expiry.
 */
export const getExpiryColor = (dateStr) => {
  if (!dateStr) return 'text-gray-400';
  const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-600 font-semibold';
  if (diffDays < 90) return 'text-orange-500 font-semibold';
  return 'text-green-600 font-semibold';
};

/**
 * Returns a color class based on a score (0-100).
 */
export const getScoreColor = (val, max = 100) => {
  if (val == null) return 'text-gray-400';
  const pct = val / max;
  if (pct >= 0.8) return 'text-green-600 font-semibold';
  if (pct >= 0.6) return 'text-orange-500 font-semibold';
  return 'text-red-600 font-semibold';
};

/**
 * Recursively flattens backend validation error messages into a human-readable string.
 * Handles nested objects (like { user: { email: [...] } }) and arrays.
 */
export const formatError = (error) => {
  if (!error) return 'An unexpected error occurred.';

  const data = error.response?.data;
  if (!data) return error.message || 'An unexpected error occurred.';

  // Support both { error: { details: ... } } and { details: ... }
  const errObj = data.error || data;

  // If backend returns a simple message
  if (errObj.message && typeof errObj.message === 'string' && !errObj.details) {
    return errObj.message;
  }

  // If backend returns structured details (VALIDATION_ERROR style)
  if (errObj.details && typeof errObj.details === 'object') {
    const messages = [];

    const extract = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fieldName = key.replace(/_/g, ' ');
        // Avoid redundant prefixes like "driver driver type"
        const label = prefix ? `${prefix} ${fieldName}` : fieldName;

        if (Array.isArray(value)) {
          // Flatten array of error strings
          const valStr = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(' ');
          messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${valStr}`);
        } else if (typeof value === 'object' && value !== null) {
          // Flatten nested object like `driver: { years_of_experience: [...] }`
          extract(value, fieldName === 'driver' || fieldName === 'user' ? '' : label);
        } else {
          messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${value}`);
        }
      });
    };

    extract(errObj.details);
    if (messages.length > 0) return messages.join(' | ');
  }

  // Fallback to top-level message
  return errObj.message || data.message || error.message || 'An unexpected error occurred.';
};

