// src/utils/dateUtils.js

/**
 * Gets the first day of the month for a given date.
 * @param {Date} date - The input date.
 * @returns {Date} - The first day of the month.
 */
export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Gets the last day of the month for a given date.
 * @param {Date} date - The input date.
 * @returns {Date} - The last day of the month.
 */
export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * @param {Date} date - The input date.
 * @returns {string} - The formatted date string.
 */
export const formatDateForInput = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // Handle invalid date input, perhaps return today's date or throw an error
    console.warn(
      "formatDateForInput received an invalid date. Defaulting to current date."
    );
    date = new Date();
  }
  return date.toISOString().split("T")[0];
};
