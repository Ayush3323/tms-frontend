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
  return driver.driver_name || driver.employee_id || 'System Driver';
};

/**
 * Clean object by converting empty strings to null.
 * Useful for handling optional fields in API requests.
 */
export const cleanObject = (obj) => {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v])
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
