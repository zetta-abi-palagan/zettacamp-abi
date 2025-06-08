/**
 * Validates if the given value can be resolved to a valid date.
 * @param {*} value - The value to validate (e.g., a string, number, or Date object).
 * @returns {boolean} True if the value is a valid date, false otherwise.
 */
function IsValidDate(value) {
    if (value instanceof Date) {
        return !isNaN(value.getTime())
    }

    const date = new Date(value);

    return !isNaN(date.getTime());
}

// *************** EXPORT MODULE ***************
module.exports = { IsValidDate };