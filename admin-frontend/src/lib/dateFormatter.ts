/**
 * Format date to HH:mm:ss dd-mm-yyyy format
 * @param date - Date string or Date object
 * @returns Formatted date string or empty string if invalid
 */
export const formatDateTime = (
  date: string | Date | undefined | null
): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Format date to dd-mm-yyyy format
 * @param date - Date string or Date object
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Format date to HH:mm:ss format
 * @param date - Date string or Date object
 * @returns Formatted time string or empty string if invalid
 */
export const formatTime = (date: string | Date | undefined | null): string => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
};
