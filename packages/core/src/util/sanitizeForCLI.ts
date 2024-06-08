/**
 * Sanitizes a string for safe usage in a CLI command.
 * @param {string} text - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
export default function sanitizeForCLI(text: string): string {
    // Escape special characters using backslashes
    const escapedText = text.replace(/(["'`\\$])/g, "\\$1")
    return escapedText
}
